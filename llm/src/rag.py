import os
from supabase import create_client, Client
from config import settings

# Initialize Supabase client
supabase_client: Client = None
if settings.SUPABASE_URL and settings.SUPABASE_KEY:
    try:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase client for RAG: {e}")

def retrieve_schemes(query_str: str, limit: int = 3):
    """
    Search active government schemes matching query
    """
    if not supabase_client:
        return []
    try:
        res = supabase_client.table("schemes") \
            .select("*") \
            .or_(f"name.ilike.%{query_str}%,description.ilike.%{query_str}%") \
            .limit(limit) \
            .execute()
        return res.data or []
    except Exception as e:
        print(f"RAG Schemes fetch error: {e}")
        return []

def retrieve_products(query_str: str, limit: int = 3):
    """
    Search agricultural marketplace products matching query
    """
    if not supabase_client:
        return []
    try:
        res = supabase_client.table("products") \
            .select("*") \
            .or_(f"name.ilike.%{query_str}%,description.ilike.%{query_str}%") \
            .limit(limit) \
            .execute()
        return res.data or []
    except Exception as e:
        print(f"RAG Products fetch error: {e}")
        return []

def retrieve_articles(query_str: str, limit: int = 3):
    """
    Search published news articles matching query
    """
    if not supabase_client:
        return []
    try:
        res = supabase_client.table("articles") \
            .select("*") \
            .eq("is_published", True) \
            .or_(f"title.ilike.%{query_str}%,description.ilike.%{query_str}%") \
            .limit(limit) \
            .execute()
        return res.data or []
    except Exception as e:
        print(f"RAG Articles fetch error: {e}")
        return []

def retrieve_disease_predictions(farmer_id: str, limit: int = 2):
    """
    Retrieve recent crop disease prediction logs of this farmer
    """
    if not supabase_client or not farmer_id:
        return []
    try:
        res = supabase_client.table("disease_predictions") \
            .select("*") \
            .eq("farmer_id", farmer_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        return res.data or []
    except Exception as e:
        print(f"RAG Disease history fetch error: {e}")
        return []

def get_rag_context(query_str: str, farmer_id: str = None) -> str:
    """
    Queries database tables and compiles clean Markdown snippets for RAG context
    """
    # Quick sanitization to avoid PostgREST query parsing errors
    clean_query = query_str.replace(",", " ").replace(":", " ").strip()
    if not clean_query or len(clean_query) < 2:
        return "No query keywords specified for database context retrieval."

    # Perform retrievals
    schemes = retrieve_schemes(clean_query)
    products = retrieve_products(clean_query)
    articles = retrieve_articles(clean_query)
    predictions = retrieve_disease_predictions(farmer_id) if farmer_id else []

    context_parts = []

    if schemes:
        context_parts.append("### Relevant Government Schemes:")
        for s in schemes:
            deadline_str = f", Deadline: {s.get('deadline')}" if s.get('deadline') else ""
            context_parts.append(f"- **{s.get('name')}**: {s.get('description')} (Agency: {s.get('agency')}{deadline_str})")

    if products:
        context_parts.append("\n### Relevant Products in Marketplace:")
        for p in products:
            context_parts.append(f"- **{p.get('name')}**: ₹{p.get('price')} - {p.get('description')} (Stock: {p.get('stock_quantity')})")

    if articles:
        context_parts.append("\n### Relevant Agricultural Articles & News:")
        for a in articles:
            context_parts.append(f"- **{a.get('title')}** (Category: {a.get('category')}): {a.get('description')}")

    if predictions:
        context_parts.append("\n### Farmer's Recent Crop Disease Logs:")
        for pred in predictions:
            confidence = int(float(pred.get('confidence_score', 0)) * 100)
            context_parts.append(f"- Crop: **{pred.get('crop_type')}**, Detected: **{pred.get('predicted_disease')}** ({confidence}% confidence) on {pred.get('created_at')[:10]}")

    if not context_parts:
        return "No specific matching government schemes, marketplace products, or news articles were found in the database for this query."

    return "\n".join(context_parts)
