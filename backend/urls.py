from django.contrib import admin
from chat.views import logout_view
from django.urls import path
from chat.views import (
    chat_api,
    login_view,
    register_view,
    check_auth,
    chat_history,
    get_username,
    get_user_info,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/chat/', chat_api),
    path('api/login/', login_view),
    path('api/register/', register_view),
    path("api/check-auth/", check_auth),
    path("api/history/", chat_history),
    path("api/user/", get_username),
    path("api/logout/", logout_view),
    path("api/user-info/", get_user_info),
]
