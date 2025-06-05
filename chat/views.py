from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from openai import OpenAI
import json
import traceback
from .models import ChatMessage
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required

client = OpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = (
    "Ти помічник для школярів які здали НМТ або ЗНО і шукають собі університет в який вони можуть поступити, ти повинен шукати інформацію базовану на їхніх балах за здані ними предмети щоб підібрати найкращі університети куди вони можуть поступити на навчання на державний бюджет, більшою мірою твої відповіді повинні опиратися на сайт osvita.ua, де ти знаходитимеш потрібну інформацію, Ти повинен відіграти роль помічника студентам які здали ЗНО/НМТ і не знають куди вони хочуть поступити, за заданою інформацією шукай виші куди вони можуть потрапити на б'юджет (навчання оплачуване державою), якщо таких немає, то на контракт Твоя відповідь повинна виглядати так: Привітання Університет факультети університету - середній бал для вступу на бюджет - рік у якому - цей бал був актуальний - коротка інформація про факультет - посилання для ознайомлення з факультетом Університет факультети університету - середній бал для вступу на бюджет - рік у якому - цей бал був актуальний - коротка інформація про факультет - посилання для ознайомлення з факультетом І так далі, для красивішого вигляду повідомлень добавляй перехлди на нові рядки"
)

@csrf_exempt
def chat_api(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        try:
            data = json.loads(request.body)
            user_message = data.get("message", "").strip()

            if not user_message:
                return JsonResponse({"error": "Empty message"}, status=400)

            # Історія чату користувача для контексту
            history = [{"role": "system", "content": SYSTEM_PROMPT}]
            past = ChatMessage.objects.filter(user=request.user).order_by('-created_at')[:10][::-1]

            for msg in past:
                history.append({"role": "user", "content": msg.user_message})
                history.append({"role": "assistant", "content": msg.bot_response})

            history.append({"role": "user", "content": user_message})

            # Відправка до OpenAI
            response = client.chat.completions.create(
                model="gpt-4",
                messages=history
            )
            bot_response = response.choices[0].message.content

            # Зберігаємо в БД
            ChatMessage.objects.create(
                user=request.user,
                user_message=user_message,
                bot_response=bot_response
            )

            return JsonResponse({"bot_response": bot_response})

        except Exception as e:
            return JsonResponse({
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=500)

    return JsonResponse({"error": "Only POST method allowed"}, status=405)


@csrf_exempt
@require_http_methods(["POST"])
def register_view(request):
    data = json.loads(request.body)
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

    if not username or not password or not email:
        return JsonResponse({"error": "Заповніть всі поля"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Користувач уже існує"}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)
    login(request, user)
    return JsonResponse({"success": True})


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    data = json.loads(request.body)
    username = data.get("username")
    password = data.get("password")

    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        return JsonResponse({"success": True})
    return JsonResponse({"error": "Невірні дані"}, status=400)


def check_auth(request):
    if request.user.is_authenticated:
        return HttpResponse("OK")
    return JsonResponse({"error": "Unauthorized"}, status=401)


@login_required
def chat_history(request):
    messages = ChatMessage.objects.filter(user=request.user).order_by("created_at")[:20]
    data = []

    for msg in messages:
        data.append({"role": "user", "content": msg.user_message})
        data.append({"role": "bot", "content": msg.bot_response})

    return JsonResponse({"history": data})

from django.contrib.auth.decorators import login_required

@login_required
def get_username(request):
    return JsonResponse({"username": request.user.username})

from django.contrib.auth import logout
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"success": True})

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

@login_required
def get_user_info(request):
    return JsonResponse({
        "username": request.user.username,
        "email": request.user.email,
    })
