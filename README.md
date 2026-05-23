# L_Shop Лабораторные работы 11-12-13 ВебПрог

IYHAN SHOP – Интернет-магазин по продаже танков в НАШЕЙ ИГРЕ.

## Участники команды
- **Разработчик 1** — [@Idhenxysvs](https://github.com/Idhenxysvs)
- **Разработчик 2** — [@Fitzowski](https://github.com/Fitzowski)
- **Разработчик 3** — [@pltdeveloper393](https://github.com/pltdeveloper393)
- **Разработчик 4** — [@rxxksyan](https://github.com/rxxksyan)

## Технологии
Бэкенд (серверная часть)
- Node.js
- Express.js
- TypeScript
- Файловая система (fs) - JSON-файлы

Фронтенд (клиентская часть)
- HTML5
- CSS3
- TypeScript
- SPA (Single Page Application)

## О проекте
IYHAN SHOP – это SPA интернет-магазин танков. Проект построен на Node.js + Express (бэкенд) и TypeScript (клиент). Проект предполагает авторизацию учётных записей для пользователей, обширный каталог танков, корзину выбранных позиций к покупке и её оплату с информацией о доставке.

## Структура проекта
```
L_Shop/
├── server/                         # Бэкенд (Node.js + Express)
│   ├── index.ts                    	# Главный сервер (точка входа)
│   ├── routes/                     	# Маршруты API
│   ├── controllers/               		# Логика обработки запросов
│   ├── models/                     	# Работа с данными             
│   ├── middleware/                 	# Промежуточные обработчики
│   └── types/                      	# TypeScript типы сервера
│       └── index.ts                   
│
├── public/                         # Статика (доступно браузеру)
│   ├── index.html                  	# HTML страница приёма SPA
│   ├── styles.css                     	# Общие css-стили проекта
│   ├── <name>-page.css                 # уникальные css-стили страниц
│   ├── ...
│   ├── js/                             # Скомпилированный JavaScript
│   └── images/                         # Изображения
│
├── src/                            # Клиентский TypeScript
│   ├── main.ts                         # Точка входа
│   ├── router.ts                       # SPA роутер
│   ├── pages/                          # TS страницы с HTML
│   │   ├── <Name>Page.ts                 	# Пример страницы
│   │   └── ...
│   ├── services/                       # Взаимодействие с сервером
│   │   ├── api.ts                      	# API авторизации
│   │   ├── api_cart.ts  					# API корзины
│   │   ├── api_catalog.ts 					# API каталога
│   │   └── api_delivery.ts 				# API доставки
│   └── types/                          # Общие типы
│       ├── index.ts                      	# Типы авторизации
│       ├── index_cart.ts  					# Типы корзины
│       ├── index_catalog.ts 				# Типы каталога
│       └── index_delivery.ts               # Типы доставки
│
├── deliveries.json 		# Данные итоговых заказов и доставки
├── tanks.json 				# Информация о товарах в каталоге
├── users.json 				# Учётные записи пользователей
├── package.json            # Зависимости
├── tsconfig.json           # Настройки TypeScript сервера
├── tsconfig.client.json    # Настройки TypeScript клиента
├── .gitignore 				# игнор папок/файлов при коммитах
└── README.md               # Вы находитесь здесь
```

## Маршруты SPA-страниц
Здесь перечислен список маршрутов для SPA-страниц проекта (конечное название страниц может отличаться)

| Страница      | Маршрут     | Описание                              |
|---------------|-------------|---------------------------------------|
| HomePage      | `/`         | Страница для юзеров без регистрации   |
| LoginPage     | `/login`    | Вход в аккаунт                        |
| RegisterPage  | `/register` | Регистрация аккаунта                  |
| MainPage      | `/main`     | Главная страница проекта              |
| ProfilePage   | `/profile`  | Профиль пользователя                  |
| CatalogPage   | `/catalog`  | Каталог товаров магазина              |
| CartPage      | `/cart`     | Корзина покупок с выбранными товарами |
| DeliveryPage  | `/delivery` | Информация о доставке                 |