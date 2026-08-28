/**
 * Demands Route — Buyer demand lifecycle
 * ─────────────────────────────────────────────
 * POST   /api/demands           — Create a new demand
 * GET    /api/demands           — List demands (filtered by role/status)
 * GET    /api/demands/:id       — Single demand with matched FPOs
 * PUT    /api/demands/:id       — Update demand
 * POST   /api/demands/:id/match — Trigger auto-matching algorithm
 * POST   /api/demands/:id/confirm — Buyer confirms matched supply
 */

import { Router, Request, Response, NextFunction } from 'express'
import { getSupabaseAdminClient } from '../config/supabase'
import { matchDemandsToYields } from '../services/marketplace/aggregationService'

const router = Router()

/**
 * POST /api/demands — Buyer creates a new demand requirement
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      buyer_profile_id, crop_type, required_quantity, max_price_per_kg,
      min_quality_grade, required_by, latitude, longitude, delivery_address
    } = req.body

    if (!buyer_profile_id || !crop_type || !required_quantity || !max_price_per_kg || !required_by || !latitude || !longitude) {
      return res.status(400).json({
        error: { message: 'Missing required fields: buyer_profile_id, crop_type, required_quantity, max_price_per_kg, required_by, latitude, longitude', code: 'MISSING_FIELDS' }
      })
    }

    const { data, error } = await getSupabaseAdminClient()
      .from('institutional_demands')
      .insert({
        buyer_profile_id,
        crop_type: crop_type.toLowerCase().trim(),
        required_quantity: parseFloat(required_quantity),
        max_price_per_kg: parseFloat(max_price_per_kg),
        min_quality_grade: min_quality_grade ?? 'B',
        required_by,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        delivery_address: delivery_address ?? null,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/demands — List demands
 * Query params: status, crop_type, buyer_id, role (buyer|farmer)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, crop_type, buyer_id, page = '1', limit = '20' } = req.query
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    let query = getSupabaseAdminClient()
      .from('institutional_demands')
      .select(`
        *,
        buyer:profiles!institutional_demands_buyer_profile_id_fkey(full_name, email, location, phone),
        fulfillment_groups:demand_fulfillment_groups(
          *,
          fpo_yield:fpo_yields(crop_type, variety, available_quantity, price_per_kg, location_name, quality_grade,
            fpo:profiles!fpo_yields_fpo_profile_id_fkey(full_name, location, phone))
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit as string) - 1)

    if (status) query = query.eq('status', status)
    if (crop_type) query = query.eq('crop_type', (crop_type as string).toLowerCase())
    if (buyer_id) query = query.eq('buyer_profile_id', buyer_id)

    const { data, error, count } = await query

    if (error) throw error

    const enriched = (data ?? []).map((d: any) => ({
      ...d,
      fulfillment_percentage: d.required_quantity > 0
        ? Math.round(((d.matched_quantity ?? 0) / d.required_quantity) * 100)
        : 0,
    }))

    res.json({ success: true, data: enriched, count, page: parseInt(page as string) })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/demands/:id — Single demand with full details
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('institutional_demands')
      .select(`
        *,
        buyer:profiles!institutional_demands_buyer_profile_id_fkey(full_name, email, location, phone),
        fulfillment_groups:demand_fulfillment_groups(
          *,
          fpo_yield:fpo_yields(*,
            fpo:profiles!fpo_yields_fpo_profile_id_fkey(full_name, location, phone),
            audit:crop_quality_audits(overall_grade, is_certified, certified_at, image_urls)
          )
        ),
        escrow:escrow_payments(*),
        logistics:logistics_orders(*)
      `)
      .eq('id', req.params.id)
      .single()

    if (error?.code === 'PGRST116') {
      return res.status(404).json({ error: { message: 'Demand not found', code: 'NOT_FOUND' } })
    }
    if (error) throw error

    res.json({
      success: true,
      data: {
        ...data,
        fulfillment_percentage: data.required_quantity > 0
          ? Math.round(((data.matched_quantity ?? 0) / data.required_quantity) * 100)
          : 0,
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/demands/:id — Update demand
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body
    const { data, error } = await getSupabaseAdminClient()
      .from('institutional_demands')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/demands/:id/match — Trigger auto-matching
 */
router.post('/:id/match', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await matchDemandsToYields(req.params.id)
    res.json({
      success: true,
      message: `Matched ${result.fulfillment_percentage}% of demand`,
      data: result,
    })
  } catch (error: any) {
    const status = error.message?.includes('not found') ? 404 : error.message?.includes('already') ? 409 : 500
    if (status !== 500) {
      return res.status(status).json({ error: { message: error.message, code: status === 404 ? 'NOT_FOUND' : 'CONFLICT' } })
    }
    next(error)
  }
})

/**
 * POST /api/demands/:id/confirm — Buyer confirms the matched supply
 */
router.post('/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getSupabaseAdminClient()

    // Update all fulfillment groups from 'matched' to 'confirmed'
    await supabase
      .from('demand_fulfillment_groups')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('demand_id', req.params.id)
      .eq('status', 'matched')

    // Update demand status
    const { data, error } = await supabase
      .from('institutional_demands')
      .update({ status: 'fully_matched', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, message: 'Order confirmed', data })
  } catch (error) {
    next(error)
  }
})

export default router
