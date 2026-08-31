let selectedFood = null;

let editingId = null;

let currentDate = getToday();


// ============================================================
// INDEXEDDB SETTINGS
// ============================================================

const DB_NAME = "NutriTrackDB";
const DB_VERSION = 1;
const STORE_NAME = "nutritionDays";

let dbPromise = null;


// ============================================================
// ELEMENTS
// ============================================================

const dateInput =
    document.getElementById("dateInput");

const foodSearch =
    document.getElementById("foodSearch");

const suggestions =
    document.getElementById("suggestions");

const foodPanel =
    document.getElementById("foodPanel");

const quantityInput =
    document.getElementById("quantity");

const unitSelect =
    document.getElementById("unit");

const mealSelect =
    document.getElementById("meal");


// ============================================================
// INDEXEDDB INITIALIZATION
// ============================================================

function openDatabase() {

    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded = function (event) {

            const db =
                event.target.result;


            if (
                !db.objectStoreNames.contains(
                    STORE_NAME
                )
            ) {

                db.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "date"
                    }
                );

            }

        };


        request.onsuccess = function () {

            resolve(request.result);

        };


        request.onerror = function () {

            console.error(
                "IndexedDB error:",
                request.error
            );

            reject(request.error);

        };

    });


    return dbPromise;

}


// ============================================================
// GET ALL DATABASE DATA
// ============================================================

async function getDatabase() {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            const request =
                store.getAll();


            request.onsuccess =
                function () {

                    const result = {};

                    request.result.forEach(
                        day => {

                            result[day.date] =
                                day.entries || [];

                        }
                    );


                    resolve(result);

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// GET ONE DAY
// ============================================================

async function getDayData(date) {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            const request =
                store.get(date);


            request.onsuccess =
                function () {

                    if (request.result) {

                        resolve(
                            request.result.entries || []
                        );

                    } else {

                        resolve([]);

                    }

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// SAVE ONE DAY
// ============================================================

async function saveDayData(
    date,
    entries
) {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            const request =
                store.put({

                    date: date,

                    entries: entries

                });


            request.onsuccess =
                function () {

                    resolve();

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// DELETE ONE DAY
// ============================================================

async function deleteDayData(date) {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            const request =
                store.delete(date);


            request.onsuccess =
                function () {

                    resolve();

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// CLEAR ALL INDEXEDDB HISTORY
// ============================================================

async function clearDatabase() {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            const request =
                store.clear();


            request.onsuccess =
                function () {

                    resolve();

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// MIGRATE OLD LOCALSTORAGE DATA
// ============================================================

async function migrateOldLocalStorage() {

    const oldData =
        localStorage.getItem(
            "nutriTrackData"
        );


    if (!oldData) {
        return;
    }


    try {

        const parsed =
            JSON.parse(oldData);


        if (
            !parsed ||
            typeof parsed !== "object"
        ) {

            return;

        }


        const db =
            await openDatabase();


        const existingData =
            await getDatabase();


        for (
            const date of Object.keys(parsed)
        ) {

            // Don't overwrite existing IndexedDB data
            if (
                existingData[date]
            ) {

                continue;

            }


            const entries =
                Array.isArray(
                    parsed[date]
                )
                    ? parsed[date]
                    : [];


            await saveDayData(
                date,
                entries
            );

        }


        // Remove old localStorage nutrition history
        localStorage.removeItem(
            "nutriTrackData"
        );


        console.log(
            "Old nutrition history migrated to IndexedDB."
        );

    }

    catch (error) {

        console.error(
            "Migration failed:",
            error
        );

    }

}


// ============================================================
// DATE
// ============================================================

dateInput.value =
    currentDate;


dateInput.addEventListener(
    "change",
    async () => {

        currentDate =
            dateInput.value;

        await render();

    }
);


document
    .getElementById("prevDay")
    .addEventListener(
        "click",
        () => changeDate(-1)
    );


document
    .getElementById("nextDay")
    .addEventListener(
        "click",
        () => changeDate(1)
    );


async function changeDate(days) {

    const date =
        new Date(
            currentDate +
            "T00:00:00"
        );


    date.setDate(
        date.getDate() + days
    );


    currentDate =
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            date.getDate()
        ).padStart(2, "0");


    dateInput.value =
        currentDate;


    await render();

}


function getToday() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    return (
        `${year}-${month}-${day}`
    );

}


// ============================================================
// SEARCH FOOD
// ============================================================

foodSearch.addEventListener(
    "input",
    searchFoods
);


function searchFoods() {

    const text =
        foodSearch.value
            .trim()
            .toLowerCase();


    suggestions.innerHTML =
        "";


    if (!text) {
        return;
    }


    const results =
        foods.filter(
            food =>
                food.name
                    .toLowerCase()
                    .includes(text)
        );


    results
        .slice(0, 10)
        .forEach(
            food => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "suggestion";


                div.textContent =
                    food.name;


                div.addEventListener(
                    "click",
                    () => {

                        selectFood(food);

                    }
                );


                suggestions.appendChild(
                    div
                );

            }
        );


    if (
        results.length === 0
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "suggestion";


        div.textContent =
            "Food not found";


        suggestions.appendChild(
            div
        );

    }

}


// ============================================================
// SELECT FOOD
// ============================================================

function selectFood(food) {

    selectedFood =
        food;


    editingId =
        null;


    foodSearch.value =
        food.name;


    suggestions.innerHTML =
        "";


    foodPanel.classList.remove(
        "hidden"
    );


    document
        .getElementById(
            "selectedFoodName"
        )
        .textContent =
        food.name;


    document
        .getElementById(
            "nutritionBasis"
        )
        .textContent =
        `Nutrition: ${food.basis}`;


    setDefaultUnit();

    calculate();


    document
        .getElementById(
            "addFoodBtn"
        )
        .textContent =
        "＋ Add Food";

}


// ============================================================
// DEFAULT UNIT
// ============================================================

function setDefaultUnit() {

    if (
        selectedFood &&
        selectedFood.mlEquivalent
    ) {

        unitSelect.value =
            "ml";

    }

    else {

        unitSelect.value =
            "g";

    }

}


// ============================================================
// CLEAR FOOD
// ============================================================

document
    .getElementById(
        "clearFood"
    )
    .addEventListener(
        "click",
        clearFood
    );


function clearFood() {

    selectedFood =
        null;


    editingId =
        null;


    foodSearch.value =
        "";


    suggestions.innerHTML =
        "";


    foodPanel.classList.add(
        "hidden"
    );


    quantityInput.value =
        "";


    document
        .getElementById(
            "addFoodBtn"
        )
        .textContent =
        "＋ Add Food";


    showCalculated(
        0,
        0,
        0,
        0,
        0
    );

}


// ============================================================
// QUANTITY EVENTS
// ============================================================

quantityInput.addEventListener(
    "input",
    calculate
);


unitSelect.addEventListener(
    "change",
    calculate
);


// ============================================================
// CALCULATE
// ============================================================

function calculate() {

    if (!selectedFood) {
        return;
    }


    let quantity =
        Number(
            quantityInput.value
        );


    if (
        !quantity ||
        quantity <= 0
    ) {

        showCalculated(
            0,
            0,
            0,
            0,
            0
        );

        return;

    }


    let grams;


    if (
        unitSelect.value === "g"
    ) {

        grams =
            quantity;

    }


    else if (
        unitSelect.value === "oz"
    ) {

        grams =
            quantity *
            28.3495;

    }


    else if (
        unitSelect.value === "ml"
    ) {

        grams =
            quantity;

    }


    else if (
        unitSelect.value === "piece"
    ) {

        if (
            selectedFood.gramsPerPiece
        ) {

            grams =
                quantity *
                selectedFood.gramsPerPiece;

        }

        else {

            alert(
                "Pieces are not available for this food. Please use grams."
            );


            unitSelect.value =
                "g";


            grams =
                quantity;

        }

    }


    const multiplier =
        grams / 100;


    const calories =
        selectedFood.calories *
        multiplier;


    const protein =
        selectedFood.protein *
        multiplier;


    const carbs =
        selectedFood.carbs *
        multiplier;


    const fat =
        selectedFood.fat *
        multiplier;


    const fiber =
        selectedFood.fiber *
        multiplier;


    showCalculated(
        calories,
        protein,
        carbs,
        fat,
        fiber
    );

}


// ============================================================
// SHOW CALCULATED
// ============================================================

function showCalculated(
    calories,
    protein,
    carbs,
    fat,
    fiber
) {

    document
        .getElementById(
            "calcCalories"
        )
        .textContent =
        round(calories);


    document
        .getElementById(
            "calcProtein"
        )
        .textContent =
        round(protein);


    document
        .getElementById(
            "calcCarbs"
        )
        .textContent =
        round(carbs);


    document
        .getElementById(
            "calcFat"
        )
        .textContent =
        round(fat);


    document
        .getElementById(
            "calcFiber"
        )
        .textContent =
        round(fiber);

}


// ============================================================
// ROUND
// ============================================================

function round(value) {

    return Math.round(
        value * 10
    ) / 10;

}


// ============================================================
// GET CURRENT NUTRITION
// ============================================================

function getCurrentNutrition() {

    if (!selectedFood) {
        return null;
    }


    const quantity =
        Number(
            quantityInput.value
        );


    if (
        !quantity ||
        quantity <= 0
    ) {

        return null;

    }


    let grams;


    if (
        unitSelect.value === "g"
    ) {

        grams =
            quantity;

    }


    else if (
        unitSelect.value === "oz"
    ) {

        grams =
            quantity *
            28.3495;

    }


    else if (
        unitSelect.value === "ml"
    ) {

        grams =
            quantity;

    }


    else if (
        unitSelect.value === "piece"
    ) {

        if (
            !selectedFood.gramsPerPiece
        ) {

            return null;

        }


        grams =
            quantity *
            selectedFood.gramsPerPiece;

    }


    const multiplier =
        grams / 100;


    return {

        calories:
            round(
                selectedFood.calories *
                multiplier
            ),


        protein:
            round(
                selectedFood.protein *
                multiplier
            ),


        carbs:
            round(
                selectedFood.carbs *
                multiplier
            ),


        fat:
            round(
                selectedFood.fat *
                multiplier
            ),


        fiber:
            round(
                selectedFood.fiber *
                multiplier
            ),


        grams:
            grams

    };

}


// ============================================================
// ADD / UPDATE FOOD
// ============================================================

document
    .getElementById(
        "addFoodBtn"
    )
    .addEventListener(
        "click",
        saveFoodEntry
    );


async function saveFoodEntry() {

    if (!selectedFood) {

        alert(
            "Please select a food."
        );

        return;

    }


    const nutrition =
        getCurrentNutrition();


    if (!nutrition) {

        alert(
            "Please enter a valid quantity."
        );

        return;

    }


    let entries =
        await getDayData(
            currentDate
        );


    const quantity =
        Number(
            quantityInput.value
        );


    const unit =
        unitSelect.value;


    const meal =
        mealSelect.value;


    if (
        editingId !== null
    ) {

        const index =
            entries.findIndex(
                item =>
                    item.id ===
                    editingId
            );


        if (
            index !== -1
        ) {

            entries[index] = {

                ...entries[index],


                food:
                    selectedFood.name,


                quantity:
                    quantity,


                unit:
                    unit,


                meal:
                    meal,


                calories:
                    nutrition.calories,


                protein:
                    nutrition.protein,


                carbs:
                    nutrition.carbs,


                fat:
                    nutrition.fat,


                fiber:
                    nutrition.fiber

            };

        }


        editingId =
            null;

    }


    else {

        entries.push({

            id:
                Date.now(),


            food:
                selectedFood.name,


            quantity:
                quantity,


            unit:
                unit,


            meal:
                meal,


            calories:
                nutrition.calories,


            protein:
                nutrition.protein,


            carbs:
                nutrition.carbs,


            fat:
                nutrition.fat,


            fiber:
                nutrition.fiber

        });

    }


    await saveDayData(
        currentDate,
        entries
    );


    clearFood();


    await render();

}


// ============================================================
// RENDER
// ============================================================

async function render() {

    try {

        const entries =
            await getDayData(
                currentDate
            );


        renderTotals(
            entries
        );


        renderFoodEntries(
            entries
        );


        await renderHistory();

    }

    catch (error) {

        console.error(
            "Render error:",
            error
        );

    }

}


// ============================================================
// TOTALS
// ============================================================

function renderTotals(
    entries
) {

    const totals = {

        calories: 0,

        protein: 0,

        carbs: 0,

        fat: 0,

        fiber: 0

    };


    entries.forEach(
        entry => {

            totals.calories +=
                Number(
                    entry.calories
                ) || 0;


            totals.protein +=
                Number(
                    entry.protein
                ) || 0;


            totals.carbs +=
                Number(
                    entry.carbs
                ) || 0;


            totals.fat +=
                Number(
                    entry.fat
                ) || 0;


            totals.fiber +=
                Number(
                    entry.fiber
                ) || 0;

        }
    );


    document
        .getElementById(
            "totalCalories"
        )
        .textContent =
        round(
            totals.calories
        );


    document
        .getElementById(
            "totalProtein"
        )
        .textContent =
        round(
            totals.protein
        );


    document
        .getElementById(
            "totalCarbs"
        )
        .textContent =
        round(
            totals.carbs
        );


    document
        .getElementById(
            "totalFat"
        )
        .textContent =
        round(
            totals.fat
        );


    document
        .getElementById(
            "totalFiber"
        )
        .textContent =
        round(
            totals.fiber
        );

}


// ============================================================
// FOOD ENTRIES
// ============================================================

function renderFoodEntries(
    entries
) {

    const container =
        document.getElementById(
            "mealSections"
        );


    const empty =
        document.getElementById(
            "emptyFood"
        );


    container.innerHTML =
        "";


    document
        .getElementById(
            "foodCount"
        )
        .textContent =
        `${entries.length} ${
            entries.length === 1
                ? "food"
                : "foods"
        }`;


    if (
        entries.length === 0
    ) {

        empty.style.display =
            "block";

        return;

    }


    empty.style.display =
        "none";


    const meals = [

        "Breakfast",

        "Lunch",

        "Evening Snack",

        "Dinner"

    ];


    meals.forEach(
        meal => {

            const mealEntries =
                entries.filter(
                    entry =>
                        entry.meal ===
                        meal
                );


            if (
                mealEntries.length === 0
            ) {

                return;

            }


            const section =
                document.createElement(
                    "div"
                );


            section.className =
                "meal-block";


            section.innerHTML = `
                <h3 class="meal-heading">
                    ${escapeHtml(meal)}
                </h3>
            `;


            mealEntries.forEach(
                entry => {

                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "food-entry";


                    div.innerHTML = `

                        <div class="food-info">

                            <h4>
                                ${escapeHtml(
                                    entry.food
                                )}
                            </h4>

                            <p>
                                ${entry.quantity}
                                ${getUnitName(
                                    entry.unit
                                )}
                            </p>

                            <p class="food-numbers">

                                🔥 ${entry.calories} kcal

                                • P ${entry.protein}g

                                • C ${entry.carbs}g

                                • F ${entry.fat}g

                                • Fiber ${entry.fiber}g

                            </p>

                        </div>


                        <div class="entry-actions">

                            <button
                                class="edit-btn"
                                onclick="editFood(${entry.id})"
                            >
                                Edit
                            </button>


                            <button
                                class="delete-btn"
                                onclick="deleteFood(${entry.id})"
                            >
                                Delete
                            </button>

                        </div>

                    `;


                    section.appendChild(
                        div
                    );

                }
            );


            container.appendChild(
                section
            );

        }
    );

}


// ============================================================
// UNIT NAME
// ============================================================

function getUnitName(unit) {

    if (
        unit === "g"
    ) {

        return "g";

    }


    if (
        unit === "oz"
    ) {

        return "oz";

    }


    if (
        unit === "ml"
    ) {

        return "ml";

    }


    if (
        unit === "piece"
    ) {

        return "piece(s)";

    }


    return unit;

}


// ============================================================
// EDIT FOOD
// ============================================================

async function editFood(id) {

    const entries =
        await getDayData(
            currentDate
        );


    const entry =
        entries.find(
            item =>
                item.id === id
        );


    if (!entry) {
        return;
    }


    const food =
        foods.find(
            item =>
                item.name ===
                entry.food
        );


    if (!food) {

        alert(
            "This food no longer exists in the food database."
        );

        return;

    }


    selectedFood =
        food;


    editingId =
        id;


    foodSearch.value =
        food.name;


    suggestions.innerHTML =
        "";


    foodPanel.classList.remove(
        "hidden"
    );


    document
        .getElementById(
            "selectedFoodName"
        )
        .textContent =
        food.name;


    document
        .getElementById(
            "nutritionBasis"
        )
        .textContent =
        `Nutrition: ${food.basis}`;


    mealSelect.value =
        entry.meal;


    quantityInput.value =
        entry.quantity;


    unitSelect.value =
        entry.unit;


    calculate();


    document
        .getElementById(
            "addFoodBtn"
        )
        .textContent =
        "✓ Update Food";


    window.scrollTo({

        top:
            foodPanel
                .getBoundingClientRect()
                .top +
            window.scrollY -
            100,

        behavior:
            "smooth"

    });

}


// ============================================================
// DELETE FOOD
// ============================================================

async function deleteFood(id) {

    if (
        !confirm(
            "Delete this food entry?"
        )
    ) {

        return;

    }


    let entries =
        await getDayData(
            currentDate
        );


    entries =
        entries.filter(
            entry =>
                entry.id !== id
        );


    if (
        entries.length === 0
    ) {

        await deleteDayData(
            currentDate
        );

    }

    else {

        await saveDayData(
            currentDate,
            entries
        );

    }


    await render();

}


// ============================================================
// HISTORY
// ============================================================

async function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );


    container.innerHTML =
        "";


    const database =
        await getDatabase();


    const dates =
        Object.keys(database)
            .sort()
            .reverse();


    if (
        dates.length === 0
    ) {

        container.innerHTML =
            `<div class="empty">
                No history yet.
            </div>`;


        return;

    }


    dates.forEach(
        date => {

            const entries =
                database[date];


            const totals = {

                calories: 0,

                protein: 0,

                carbs: 0,

                fat: 0,

                fiber: 0

            };


            entries.forEach(
                entry => {

                    totals.calories +=
                        Number(
                            entry.calories
                        ) || 0;


                    totals.protein +=
                        Number(
                            entry.protein
                        ) || 0;


                    totals.carbs +=
                        Number(
                            entry.carbs
                        ) || 0;


                    totals.fat +=
                        Number(
                            entry.fat
                        ) || 0;


                    totals.fiber +=
                        Number(
                            entry.fiber
                        ) || 0;

                }
            );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "history-item";


            item.innerHTML = `

                <div class="history-date">
                    📅 ${formatDate(date)}
                </div>


                <div class="history-values">

                    🔥 ${round(
                        totals.calories
                    )} kcal

                    <br>

                    🥩 Protein:
                    ${round(
                        totals.protein
                    )} g

                    &nbsp; | &nbsp;

                    🍚 Carbs:
                    ${round(
                        totals.carbs
                    )} g

                    <br>

                    🥑 Fat:
                    ${round(
                        totals.fat
                    )} g

                    &nbsp; | &nbsp;

                    🌾 Fiber:
                    ${round(
                        totals.fiber
                    )} g

                </div>

            `;


            item.addEventListener(
                "click",
                async () => {

                    currentDate =
                        date;


                    dateInput.value =
                        date;


                    await render();


                    window.scrollTo({

                        top: 0,

                        behavior:
                            "smooth"

                    });

                }
            );


            container.appendChild(
                item
            );

        }
    );

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    dateString
) {

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    return date.toLocaleDateString(
        "en-IN",
        {

            weekday:
                "short",

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"

        }
    );

}


// ============================================================
// CLEAR HISTORY
// ============================================================

document
    .getElementById(
        "clearHistory"
    )
    .addEventListener(
        "click",
        clearHistory
    );


async function clearHistory() {

    const database =
        await getDatabase();


    if (
        Object.keys(database)
            .length === 0
    ) {

        alert(
            "There is no history to delete."
        );

        return;

    }


    const confirmed =
        confirm(
            "Delete ALL nutrition history? This cannot be undone unless you have a backup."
        );


    if (!confirmed) {
        return;
    }


    await clearDatabase();


    await render();


    alert(
        "All nutrition history has been deleted."
    );

}


// ============================================================
// BACKUP
// ============================================================

document
    .getElementById(
        "backupBtn"
    )
    .addEventListener(
        "click",
        backupData
    );


async function backupData() {

    try {

        const database =
            await getDatabase();


        const backup = {

            app:
                "NutriTrack",


            version:
                2,


            storage:
                "IndexedDB",


            exportedAt:
                new Date()
                    .toISOString(),


            data:
                database

        };


        const json =
            JSON.stringify(
                backup,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `nutritrack-backup-${getToday()}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        alert(
            "Backup created successfully."
        );

    }

    catch (error) {

        console.error(
            "Backup error:",
            error
        );


        alert(
            "Could not create backup."
        );

    }

}


// ============================================================
// RESTORE
// ============================================================

document
    .getElementById(
        "restoreBtn"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "restoreFile"
                )
                .click();

        }
    );


document
    .getElementById(
        "restoreFile"
    )
    .addEventListener(
        "change",
        restoreData
    );


async function restoreData(
    event
) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        async function () {

            try {

                const backup =
                    JSON.parse(
                        reader.result
                    );


                if (
                    !backup.data ||
                    typeof backup.data !==
                    "object"
                ) {

                    throw new Error(
                        "Invalid backup"
                    );

                }


                const confirmed =
                    confirm(
                        "Restore this backup? Your current data will be replaced."
                    );


                if (!confirmed) {

                    event.target.value =
                        "";

                    return;

                }


                await clearDatabase();


                const dates =
                    Object.keys(
                        backup.data
                    );


                for (
                    const date of dates
                ) {

                    const entries =
                        Array.isArray(
                            backup.data[date]
                        )
                            ? backup.data[date]
                            : [];


                    if (
                        entries.length > 0
                    ) {

                        await saveDayData(
                            date,
                            entries
                        );

                    }

                }


                await render();


                alert(
                    "Backup restored successfully."
                );

            }

            catch (error) {

                console.error(
                    "Restore error:",
                    error
                );


                alert(
                    "This is not a valid NutriTrack backup file."
                );

            }


            event.target.value =
                "";

        };


    reader.readAsText(
        file
    );

}


// ============================================================
// HTML SECURITY
// ============================================================

function escapeHtml(text) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// PWA
// ============================================================

let deferredPrompt =
    null;


window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();


        deferredPrompt =
            event;


        const installBtn =
            document.getElementById(
                "installBtn"
            );


        if (installBtn) {

            installBtn.style.display =
                "block";

        }

    }
);


const installBtn =
    document.getElementById(
        "installBtn"
    );


if (installBtn) {

    installBtn.addEventListener(
        "click",
        async () => {

            if (
                !deferredPrompt
            ) {

                alert(
                    "Open your browser menu and select Add to Home screen."
                );

                return;

            }


            deferredPrompt.prompt();


            await deferredPrompt
                .userChoice;


            deferredPrompt =
                null;


            installBtn.style.display =
                "none";

        }
    );

}


// ============================================================
// SERVICE WORKER
// ============================================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "sw.js"
                )
                .catch(
                    error =>
                        console.log(
                            "Service worker error:",
                            error
                        )
                );

        }
    );

}


// ============================================================
// PROFILE PHOTO & NAME
// ============================================================

const profilePhoto =
    document.getElementById(
        "profilePhoto"
    );


const profilePhotoInput =
    document.getElementById(
        "profilePhotoInput"
    );


const changePhotoBtn =
    document.getElementById(
        "changePhotoBtn"
    );


const defaultProfileIcon =
    document.getElementById(
        "defaultProfileIcon"
    );


const profileName =
    document.getElementById(
        "profileName"
    );


// ============================================================
// LOAD PROFILE
// ============================================================

function loadProfile() {

    if (
        !profileName
    ) {
        return;
    }


    const savedName =
        localStorage.getItem(
            "nutritionProfileName"
        );


    if (
        savedName
    ) {

        profileName.textContent =
            savedName;

    }


    const savedPhoto =
        localStorage.getItem(
            "nutritionProfilePhoto"
        );


    if (
        savedPhoto &&
        profilePhoto
    ) {

        profilePhoto.src =
            savedPhoto;


        profilePhoto.style.display =
            "block";


        if (
            defaultProfileIcon
        ) {

            defaultProfileIcon.style.display =
                "none";

        }

    }

}


// ============================================================
// CHANGE PHOTO BUTTON
// ============================================================

if (
    changePhotoBtn &&
    profilePhotoInput
) {

    changePhotoBtn.addEventListener(
        "click",
        function () {

            profilePhotoInput.click();

        }
    );

}


// ============================================================
// SELECT PHOTO
// ============================================================

if (
    profilePhotoInput
) {

    profilePhotoInput.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Please select an image."
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function (e) {

                    const img =
                        new Image();


                    img.onload =
                        function () {

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            const maxSize =
                                500;


                            let width =
                                img.width;


                            let height =
                                img.height;


                            if (
                                width >
                                height
                            ) {

                                if (
                                    width >
                                    maxSize
                                ) {

                                    height =
                                        height *
                                        (
                                            maxSize /
                                            width
                                        );


                                    width =
                                        maxSize;

                                }

                            }

                            else {

                                if (
                                    height >
                                    maxSize
                                ) {

                                    width =
                                        width *
                                        (
                                            maxSize /
                                            height
                                        );


                                    height =
                                        maxSize;

                                }

                            }


                            canvas.width =
                                width;


                            canvas.height =
                                height;


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            ctx.drawImage(

                                img,

                                0,

                                0,

                                width,

                                height

                            );


                            const imageData =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.8
                                );


                            if (
                                profilePhoto
                            ) {

                                profilePhoto.src =
                                    imageData;


                                profilePhoto.style.display =
                                    "block";

                            }


                            if (
                                defaultProfileIcon
                            ) {

                                defaultProfileIcon.style.display =
                                    "none";

                            }


                            localStorage.setItem(
                                "nutritionProfilePhoto",
                                imageData
                            );

                        };


                    img.src =
                        e.target.result;

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


// ============================================================
// CHANGE NAME
// ============================================================

if (
    profileName
) {

    profileName.addEventListener(
        "click",
        function () {

            const currentName =
                profileName.textContent;


            const newName =
                prompt(
                    "Enter your name:",
                    currentName ===
                    "Your Name"
                        ? ""
                        : currentName
                );


            if (
                newName === null
            ) {

                return;

            }


            const cleanedName =
                newName.trim();


            if (
                cleanedName === ""
            ) {

                alert(
                    "Please enter a name."
                );

                return;

            }


            profileName.textContent =
                cleanedName;


            localStorage.setItem(
                "nutritionProfileName",
                cleanedName
            );

        }
    );

}


// ============================================================
// START APP
// ============================================================

async function startApp() {

    try {

        // Open IndexedDB
        await openDatabase();


        // Move old localStorage history
        // into IndexedDB if it exists
        await migrateOldLocalStorage();


        // Load profile
        loadProfile();


        // Render app
        await render();


        console.log(
            "NutriTrack started successfully."
        );


    }

    catch (error) {

        console.error(
            "NutriTrack startup error:",
            error
        );


        alert(
            "There was a problem opening your nutrition database."
        );

    }

}


startApp();