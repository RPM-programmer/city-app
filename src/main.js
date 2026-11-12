const fetch = window.__TAURI__?.http?.fetch || window.fetch;
const API_URL = "https://vyazan-city.serveousercontent.com";

// Элементы интерфейса
const statusEl = document.getElementById("server-status");
const updatedEl = document.getElementById("last-updated");
const navItems = document.querySelectorAll(".nav-item");
const tabSections = document.querySelectorAll(".tab-section");
const refreshBtn = document.getElementById("refresh-btn");
const logoHome = document.getElementById("logo-home");

// Элементы игры и новостей
const gameBanner = document.getElementById("future-game-banner");
const gameDateText = document.getElementById("game-date-text");
const gameTimeText = document.getElementById("game-time-text");
const newsEmptyMsg = document.getElementById("news-empty-msg");
const newsMsgTitle = document.getElementById("news-msg-title");
const newsMsgText = document.getElementById("news-msg-text");
const newsContainer = document.getElementById("news-list-container");
const cardTemplate = document.getElementById("news-card-template");

// Переключение вкладок через display: none / block
function switchTab(tabName) {
  navItems.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  tabSections.forEach((section) => {
    section.style.display = section.id === `tab-${tabName}` ? "block" : "none";
  });
}

// Загрузка данных с сервера
async function loadServerData() {
  statusEl.textContent = "⏳ Синхронизация с сервером...";

  try {
    const response = await fetch(API_URL + "/api/data", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "CITY-App/1.0",
        "ngrok-skip-browser-warning": "true",
        "Bypass-Tunnel-Reminder": "true",
      },
    });

    const rawText = await response.text();
    if (rawText.trim().startsWith("<")) {
      throw new Error("Вернулся HTML: " + rawText.slice(0, 150));
    }

    const data = JSON.parse(rawText);

    // Обновляем статус сверху
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    statusEl.innerHTML = '<span class="online-dot"></span>Сервер CITY онлайн';
    updatedEl.textContent = `Обновлено в ${now}`;

    // 1. Управляем баннером игры (display: flex или display: none)
    if (data["future-game"] === true) {
      gameDateText.textContent = `📅 ${data["game-date"] || "Дата уточняется"}`;
      gameTimeText.textContent = `⏰ ${data["game-time"] || "Время уточняется"}`;
      gameBanner.style.display = "flex";
    } else {
      gameBanner.style.display = "none";
    }

    // 2. Управляем списком новостей
    newsContainer.innerHTML = "";
    const newsList = data["news-list"];

    if (data.news === false) {
      newsMsgTitle.textContent = "Лента новостей отключена";
      newsMsgText.textContent =
        "Администрация временно скрыла публикацию новостей.";
      newsEmptyMsg.style.display = "block";
    } else if (!Array.isArray(newsList) || newsList.length === 0) {
      newsMsgTitle.textContent = "Новостей пока нет";
      newsMsgText.textContent =
        "Следите за обновлениями — скоро здесь появятся свежие события.";
      newsEmptyMsg.style.display = "block";
    } else {
      newsEmptyMsg.style.display = "none";

      newsList.forEach((item) => {
        const clone = cardTemplate.content.cloneNode(true);
        clone.querySelector(".tpl-title").textContent =
          item.title || "Новость города";
        clone.querySelector(".tpl-text").textContent = item.text || "";

        const dateEl = clone.querySelector(".tpl-date");
        if (item.date) {
          dateEl.textContent = `📅 ${item.date}`;
        } else {
          dateEl.style.display = "none";
        }

        const idEl = clone.querySelector(".tpl-id");
        if (item.id !== undefined) {
          idEl.textContent = `#${item.id}`;
        } else {
          idEl.style.display = "none";
        }

        newsContainer.appendChild(clone);
      });
    }
  } catch (error) {
    statusEl.textContent = "🔴 Ошибка получения данных";
    gameBanner.style.display = "none";
    newsContainer.innerHTML = "";
    newsMsgTitle.textContent = "Ошибка подключения";
    newsMsgText.textContent = error.message;
    newsEmptyMsg.style.display = "block";
  }
}

// События кнопок
navItems.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

logoHome.addEventListener("click", () => switchTab("news"));
refreshBtn.addEventListener("click", loadServerData);
window.addEventListener("DOMContentLoaded", loadServerData);
setInterval(loadServerData, 30000); // обновлять данные каждые 30 секунд
