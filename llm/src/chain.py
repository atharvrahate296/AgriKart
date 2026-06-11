import os
from typing import List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from config import settings

# Attempt to load LLM providers
llm_model = None

# Custom Mock LLM for local testing and missing API key fallback
class MockAgriAssistant:
    def generate_response(self, prompt_text: str, user_query: str) -> str:
        query_lower = user_query.lower()
        
        if "scheme" in query_lower or "government" in query_lower:
            return (
                "Based on the government schemes in our database, you may qualify for the PM-KISAN Scheme. "
                "This provides financial assistance of ₹6,000 per year in three equal installments. "
                "I suggest reviewing the required documents like Aadhaar card and land ownership certificates "
                "under the Schemes Hub to apply."
            )
        elif "disease" in query_lower or "pest" in query_lower or "armyworm" in query_lower or "blight" in query_lower:
            return (
                "For crop disease management, early detection is key. If you are dealing with pests like fall armyworm "
                "or fungus like late blight, please check the Disease Intelligence history or upload a fresh leaf photo. "
                "Applying organic Neem Oil or copper-based fungicide is recommended. You can purchase these "
                "directly from verified vendors in the AgriKart marketplace."
            )
        elif "weather" in query_lower or "rain" in query_lower:
            return (
                "According to recent regional alerts, weather warnings indicate heavy rain or temperature changes. "
                "Please check the weather category in the Agri News tab for locations-specific warnings. "
                "I recommend delaying any fertilizer spraying or pesticide application until the rains subside."
            )
        elif "product" in query_lower or "seed" in query_lower or "buy" in query_lower or "fertilizer" in query_lower:
            return (
                "You can search for high-quality seeds, bio-fertilizers, and organic pesticides directly "
                "in our Marketplace. I suggest filtering products by category and reading vendor ratings to select the best option."
            )
        else:
            return (
                "Hello! I am your AgriKart AI Agricultural Companion. I can guide you on government schemes, "
                "suggest fertilizers or seeds from the marketplace, explain disease classification details, "
                "or summarize agricultural news. How can I help you today?"
            )

# Setup LLM based on provider
if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        # Set API key in environment for LangChain component
        os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY
        llm_model = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            temperature=0.3
        )
    except Exception as e:
        print(f"Warning: Failed to load Gemini LLM, falling back to Mock: {e}")
elif settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
    try:
        from langchain_community.chat_models import ChatOpenAI
        llm_model = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
            temperature=0.3
        )
    except Exception as e:
        print(f"Warning: Failed to load OpenAI LLM, falling back to Mock: {e}")

# Dynamic System prompt instructing the assistant on role, tone, and formatting.
SYSTEM_INSTRUCTION = (
    "You are the AgriKart AI Agricultural Assistant, a friendly and experienced farming companion. "
    "Your goal is to help farmers discover relevant government schemes, recommend products from the "
    "marketplace, analyze disease detection outputs, and digest news updates.\n\n"
    "Guidelines:\n"
    "1. Be concise, practical, and polite.\n"
    "2. If database context is provided below, use it to give accurate details about schemes, products, or news.\n"
    "3. Keep answers grounded. If you do not know the answer, say so.\n"
    "4. Format your responses in clear Markdown with bullet points where appropriate."
)

async def ask_assistant(
    query: str,
    history: List[Dict[str, str]],
    context: str,
    profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Invokes the LangChain model or falls back to Mock engine to generate context-aware response.
    """
    # 1. Build profile metadata string if available
    profile_info = ""
    if profile:
        state = profile.get("state")
        crops = ", ".join(profile.get("primary_crops", [])) or "None"
        profile_info = f"\nFarmer Profile Info - Location State: {state}, Grows Crops: {crops}."

    # 2. Build full prompt messages
    system_prompt = f"{SYSTEM_INSTRUCTION}{profile_info}\n\n[DATABASE RETRIEVED CONTEXT]\n{context}"
    messages = [SystemMessage(content=system_prompt)]

    # Add historical chat history
    for msg in history:
        role = msg.get("role")
        content = msg.get("content")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    # Add current question
    messages.append(HumanMessage(content=query))

    response_text = ""
    model_name = settings.LLM_PROVIDER

    # 3. Execute model or Mock
    if llm_model:
        try:
            # LangChain chat call
            response = await llm_model.ainvoke(messages)
            response_text = response.content
        except Exception as e:
            print(f"Error calling live LLM, falling back to mock: {e}")
            mock_model = MockAgriAssistant()
            response_text = mock_model.generate_response(system_prompt, query)
            model_name = "mock-fallback"
    else:
        # Fallback Mock
        mock_model = MockAgriAssistant()
        response_text = mock_model.generate_response(system_prompt, query)
        model_name = "mock-fallback"

    return {
        "success": True,
        "response": response_text,
        "model": model_name,
        "tokens_used": len(query.split()) + len(response_text.split()) + 100, # approximate count for mock
    }
