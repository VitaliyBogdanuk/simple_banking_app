// =======================
// Banking Simulator:
// 1) Стан і змінні
// 2) Пошук елементів на сторінці
// 3) Маленькі допоміжні функції
// 4) localStorage (save/load)
// 5) Підрахунки (тотали)
// 6) ФІЛЬТРИ ДЛЯ ІСТОРІЇ
// 7) Рендер (оновлення інтерфейсу)
// 8) Бізнес-логіка (додати транзакцію)
// 9) Події кнопок
// 10) Старт застосунку
// =======================

// 1) СТАН ЗАСТОСУНКУ
// Тут зберігаємо дані. Їх будемо змінювати і потім зберігати у localStorage.
let account = {
    balance: 0, //поточний баланс
    transactions: [] //список транзакцій: {id, type, amount, date} 
};

//Поточний фільтр для історії транзакцій
// "all", "deposit", "withdraw"
let activeFilter = "all";

// 2) ЕЛЕМЕНТИ СТОРІНКИ (DOM)
// Знаходимо потрібні елементи один раз і потім використовуємо.
const balanceValue = document.getElementById('balanceValue');

const depositInput = document.getElementById('depositInput');
const depositBtn = document.getElementById('depositBtn');

const withdrawInput = document.getElementById('withdrawInput');
const withdrawBtn = document.getElementById('withdrawBtn');

const errorText = document.getElementById('errorText');

const clearBtn = document.getElementById('clearBtn');

const filterAll = document.getElementById('filterAll');
const filterIn = document.getElementById('filterIn');
const filterOut = document.getElementById('filterOut');

const totalInValue = document.getElementById('totalInValue');
const totalOutValue = document.getElementById('totalOutValue');
const transactionsList = document.getElementById('transactionsList');

const emptyState = document.getElementById('emptyState');


// 3) ДОПОМІЖНІ ФУНКЦІЇ
// Ці функції маленькі і роблять одну просту дію.

// Показує повідомлення про помилку
function showError(text) {
    if (!errorText) return;
    errorText.textContent = text || "";
}

// Читає число з input і перевіряє його
// Повертає число або null, якщо значення не коректне
function readAmount(inputEl) {
    const amount = Number(inputEl.value);

    if (amount <= 0) return null; // має бути більше 0

    return Math.round(amount * 100) / 100;
}

// Генеруємо ІД для транзакції
function makeId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return String(Date.now());
}

// 4) localStorage
// Зберігаємо й завантажуємо account, щоб дані не зникали після перезавантаження сторінки.

// Зберегти account у localStorage
function save() {
    localStorage.setItem("account", JSON.stringify(account));
}

// Завантажити account з localStorage
function load() {
    const raw = localStorage.getItem("account");
    if (!raw) return;

    try {
        const data = JSON.parse(raw);

        const balance = Number(data.balance);
        const transactions = Array.isArray(data.transactions) ? data.transactions : [];

        account = {
            balance,
            transactions
        };

    } catch (e) {
        account = { balance: 0, transactions: [] };
        console.log('Сталась неочікувана помилка: ', e);
    }

}

// 5) ПІДРАХУНКИ ДЛЯ СТАТИСТИКИ
// Рахуємо скільки всього поповнень і скільки всього зняттів.

function calcTotals() {
    let totalIn = 0;
    let totalOut = 0;

    account.transactions.forEach(t => {
        const amount = Number(t.amount) || 0;

        if (t.type === "deposit") totalIn += amount;
        if (t.type === "withdraw") totalOut += amount;
    });

    return {
        totalIn: Math.round(totalIn * 100) / 100,
        totalOut: Math.round(totalOut * 100) / 100
    };
}

function renderTotals() {
    const totals = calcTotals();

    if (totalInValue) totalInValue.textContent = totals.totalIn;
    if (totalOutValue) totalOutValue.textContent = totals.totalOut;
}

// 6) ФІЛЬТРИ ДЛЯ ІСТОРІЇ
// Керуємо тим, які транзакції показувати у списку.
function updateFilterButtons(){
    if(filterAll){
        filterAll.classList.toggle("is-active", activeFilter === "all")
    }

    if(filterIn){
        filterIn.classList.toggle("is-active", activeFilter === "deposit")
    }

    if(filterOut){
        filterOut.classList.toggle("is-active", activeFilter === "withdraw")
    }
}

// Повертає транзакції з урахуванням activeFilter
function getVisibleTransactions(){
    if (activeFilter === "all") return account.transactions;
    return account.transactions.filter(t => t.type === activeFilter)
}

// 7) РЕНДЕР (ОНОВЛЕННЯ ІНТЕРФЕЙСУ)
// Це головна функція, яка перемальовує все що бачить користувач.

// Створюємо один елемент транзакції <li>
function createTransactionItem(t){
    const li = document.createElement('li');
    li.className = 'tx';

    const left = document.createElement('div');
    left.className = 'tx-left';

    const title = document.createElement('div');
    title.className = 'tx-title';

    const isDeposit = t.type === 'deposit';

    const badge = document.createElement('span');
    badge.className = "badge "+ (isDeposit ? "badge-in" : "badge-out");
    badge.textContent = isDeposit ? "Deposit" : "Withdraw";

    const label = document.createElement('span');
    label.textContent = "Transaction";

    title.appendChild(badge);
    title.appendChild(label);

    left.appendChild(title);

    const amount = document.createElement('div');
    amount.className = "tx-amount "+ (isDeposit ? "amount-in" : "amount-out");
    amount.textContent = (isDeposit ? "+$" : "-$") + t.amount;

    li.appendChild(left);
    li.appendChild(amount);

    return li;
}

function render() {
    if(balanceValue) balanceValue.textContent = account.balance;

    const visible = getVisibleTransactions();
    const hasAny = account.transactions.length > 0;
    const hasVisible = visible.length > 0;

    if(emptyState){
        if(!hasAny){
            emptyState.style.display = 'block';
            emptyState.textContent = 'No transactions yet';
        } else if (!hasVisible) {
            emptyState.style.display = 'block';
            emptyState.textContent = 'No transactions in this filter';
        } else {
            emptyState.style.display = 'none';
        }
    }

    if(transactionsList) {
        transactionsList.innerHTML = "";
        visible.forEach(t => {
            transactionsList.appendChild(createTransactionItem(t));
        });
    }

    renderTotals();
}

// 8) БІЗНЕС-ЛОГІКА
// Тут ми додаємо транзакцію і змінюємо баланс.
function addTransaction(type, amount){
    const tx = {
        id: makeId(),
        type,
        amount,
        date: new Date().toLocaleString()
    };

    account.transactions.unshift(tx);

    if(type === 'deposit') account.balance += amount;
    if(type === 'withdraw') account.balance -= amount;

    save();
    render();
}

// 9) ПОДІЇ (КНОПКИ)
// Коли користувач натискає кнопку, ми читаємо input, перевіряємо і додаємо транзакцію.
if(depositBtn){
    depositBtn.addEventListener("click", () => {
        const amount = readAmount(depositInput);

        addTransaction('deposit', amount);
    });
}

if(withdrawBtn){
    withdrawBtn.addEventListener("click", () => {
        const amount = readAmount(withdrawInput);

        addTransaction('withdraw', amount);
    });
}

// 10) СТАРТ ЗАСТОСУНКУ
// 1) Завантажуємо дані
// 2) Ставимо фільтр "all" і малюємо все

load();