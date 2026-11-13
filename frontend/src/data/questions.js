import React from 'react';
import { OverlappingPentagons, CalendarVisual } from '../components/ClinicalVisuals';

// ─── Dynamic Client Date & Time Orientation Helpers ──────────────────────────
export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export const DAY_NAMES = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
        case 1:  return `${day}st`;
        case 2:  return `${day}nd`;
        case 3:  return `${day}rd`;
        default: return `${day}th`;
    }
}

/**
 * Modern Fisher-Yates array shuffling
 */
export function shuffleArray(arr) {
    if (!Array.isArray(arr)) return [];
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Derives accurate orientation answers and realistic options
 * based on the client's laptop date, time, and active user state.
 */
export function getDynamicOrientationData(date = new Date()) {
    const currentYear = date.getFullYear();
    const currentMonthIndex = date.getMonth(); // 0 - 11
    const currentMonthName = MONTH_NAMES[currentMonthIndex];
    const currentDayIndex = date.getDay(); // 0 - 6
    const currentDayName = DAY_NAMES[currentDayIndex];
    const currentDateNum = date.getDate(); // 1 - 31
    const currentDateStr = getOrdinalSuffix(currentDateNum);

    // Standard 4 Seasons
    let currentSeason = "Winter";
    if (currentMonthIndex >= 2 && currentMonthIndex <= 4) currentSeason = "Spring";
    else if (currentMonthIndex >= 5 && currentMonthIndex <= 7) currentSeason = "Summer";
    else if (currentMonthIndex >= 8 && currentMonthIndex <= 10) currentSeason = "Autumn";

    // 1. Year options
    const yearOptions = [
        String(currentYear - 2),
        String(currentYear - 1),
        String(currentYear),
        String(currentYear + 1)
    ];

    // 2. Season options
    const seasonOptions = ["Winter", "Spring", "Summer", "Autumn"];

    // 3. Month options
    const monthOffsets = [-1, 0, 1, 2];
    const monthOptions = monthOffsets.map(o => MONTH_NAMES[(currentMonthIndex + o + 12) % 12]);

    // 4. Day of the week options
    const dayOffsets = [-1, 0, 1, 2];
    const dayOptions = dayOffsets.map(o => DAY_NAMES[(currentDayIndex + o + 7) % 7]);

    // 5. Date of month options
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    let startDay = currentDateNum - 1;
    if (startDay < 1) startDay = 1;
    if (startDay + 3 > daysInMonth) startDay = Math.max(1, daysInMonth - 3);
    const dateOptions = [0, 1, 2, 3].map(i => getOrdinalSuffix(startDay + i));

    // 6. Identity Name
    let userName = "Alex Mercer";
    try {
        const storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('cf_user') : null;
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed?.full_name?.trim()) {
                userName = parsed.full_name.trim();
            }
        }
    } catch (_) {}

    const defaultNames = ["John Doe", "Jane Smith", "Robert Johnson", "Alex Mercer"];
    const filteredPool = defaultNames.filter(n => n.toLowerCase() !== userName.toLowerCase());
    const nameOptions = [userName, filteredPool[0] || "John Doe", filteredPool[1] || "Jane Smith", filteredPool[2] || "Robert Johnson"];

    return {
        year: { correctAnswer: String(currentYear), options: yearOptions },
        season: { correctAnswer: currentSeason, options: seasonOptions },
        month: { correctAnswer: currentMonthName, options: monthOptions },
        day: { correctAnswer: currentDayName, options: dayOptions },
        date: { correctAnswer: currentDateStr, options: dateOptions },
        identity: { correctAnswer: userName, options: nameOptions }
    };
}

// ─── MMSE Diagnostic Questions ───────────────────────────────────────────────
export function getMMSEQuestions(date = new Date()) {
    const dyn = getDynamicOrientationData(date);

    const baseQuestions = [
        // 1️⃣ Orientation to Time (5 Questions)
        {
            id: 1,
            section: "Orientation to Time",
            domain: "Orientation",
            question: "What year is it right now?",
            image: "/images/hourglass.jpg",
            options: dyn.year.options,
            correctAnswer: dyn.year.correctAnswer,
            explanation: `Current calendar year is ${dyn.year.correctAnswer}. Evaluates temporal orientation.`,
            score: 1
        },
        {
            id: 2,
            section: "Orientation to Time",
            domain: "Orientation",
            question: "What season is it currently?",
            image: "/images/nature.jpg",
            options: dyn.season.options,
            correctAnswer: dyn.season.correctAnswer,
            explanation: `Current season is ${dyn.season.correctAnswer}. Tests seasonal awareness.`,
            score: 1
        },
        {
            id: 3,
            section: "Orientation to Time",
            domain: "Orientation",
            question: "What month is it right now?",
            image: React.createElement(CalendarVisual),
            options: dyn.month.options,
            correctAnswer: dyn.month.correctAnswer,
            explanation: `Current month is ${dyn.month.correctAnswer}. Assesses temporal sequencing.`,
            score: 1
        },
        {
            id: 4,
            section: "Orientation to Time",
            domain: "Orientation",
            question: "What day of the week is today?",
            options: dyn.day.options,
            correctAnswer: dyn.day.correctAnswer,
            explanation: `Today is ${dyn.day.correctAnswer}. Evaluates diurnal time tracking.`,
            score: 1
        },
        {
            id: 5,
            section: "Orientation to Time",
            domain: "Orientation",
            question: "What is today's date?",
            options: dyn.date.options,
            correctAnswer: dyn.date.correctAnswer,
            explanation: `Today's date is ${dyn.date.correctAnswer}. Tests immediate calendar orientation.`,
            score: 1
        },

        // 2️⃣ Orientation to Place (5 Questions)
        {
            id: 6,
            section: "Orientation to Place",
            domain: "Orientation",
            question: "What country are you currently in?",
            image: "/images/world_map.jpg",
            options: ["India", "USA", "UK", "Canada"],
            correctAnswer: "India",
            explanation: "Geographic national orientation. Assesses macro-spatial awareness.",
            score: 1
        },
        {
            id: 7,
            section: "Orientation to Place",
            domain: "Orientation",
            question: "What state or province are you currently in?",
            options: ["Maharashtra", "Gujarat", "Karnataka", "Delhi"],
            correctAnswer: "Maharashtra",
            explanation: "Regional geographic orientation.",
            score: 1
        },
        {
            id: 8,
            section: "Orientation to Place",
            domain: "Orientation",
            question: "In what city are you currently located?",
            options: ["Mumbai", "Pune", "Nashik", "Thane"],
            correctAnswer: "Mumbai",
            explanation: "City-level geographic orientation.",
            score: 1
        },
        {
            id: 9,
            section: "Orientation to Place",
            domain: "Orientation",
            question: "In which district or metropolitan zone are we currently located?",
            image: "/images/cityscape.jpg",
            options: ["Mumbai Suburban", "Pune Central", "Thane City", "Nashik Rural"],
            correctAnswer: "Mumbai Suburban",
            explanation: "District/municipal spatial orientation.",
            score: 1
        },
        {
            id: 10,
            section: "Orientation to Place",
            domain: "Orientation",
            question: "Please confirm your full identity name for orientation verification.",
            image: "/images/profile.jpg",
            options: dyn.identity.options,
            correctAnswer: dyn.identity.correctAnswer,
            explanation: "Personal autobiographical orientation and self-identification.",
            score: 1,
            isDynamic: true
        },

        // 3️⃣ Registration (Immediate Memory Encoding) (3 Questions)
        {
            id: 11,
            section: "Registration (Memory Encoding)",
            domain: "Registration",
            question: "Memory Registration 1/3: Memorize the fruit in this list — 'APPLE, TABLE, CAR'. Which word was the fruit?",
            image: "/images/apple.jpg",
            options: ["Apple", "Banana", "Orange", "Mango"],
            correctAnswer: "Apple",
            explanation: "Target item: 'Apple'. Remember this word — you will be asked to recall it later to test memory sharpness!",
            score: 1
        },
        {
            id: 12,
            section: "Registration (Memory Encoding)",
            domain: "Registration",
            question: "Memory Registration 2/3: In the list 'APPLE, TABLE, CAR', which word identified a piece of furniture?",
            image: "/images/table.jpg",
            options: ["Table", "Chair", "Desk", "Cupboard"],
            correctAnswer: "Table",
            explanation: "Target item: 'Table'. Remember this word — you will be tested on it again later!",
            score: 1
        },
        {
            id: 13,
            section: "Registration (Memory Encoding)",
            domain: "Registration",
            question: "Memory Registration 3/3: In the list 'APPLE, TABLE, CAR', which word was the vehicle?",
            image: "/images/car.jpg",
            options: ["Car", "Bus", "Train", "Bicycle"],
            correctAnswer: "Car",
            explanation: "Target item: 'Car'. Memorize all 3: Apple, Table, Car. Delayed recall will be tested shortly.",
            score: 1
        },

        // 4️⃣ Attention & Calculation (5 Questions)
        {
            id: 14,
            section: "Attention & Calculation",
            domain: "Attention & Calculation",
            question: "Serial Subtraction 1/5: What is 100 − 7?",
            image: "/images/math.jpg",
            options: ["93", "94", "92", "91"],
            correctAnswer: "93",
            explanation: "100 − 7 = 93. Evaluates working memory and mental arithmetic calculation.",
            score: 1
        },
        {
            id: 15,
            section: "Attention & Calculation",
            domain: "Attention & Calculation",
            question: "Continuing serial subtraction: What is 93 − 7?",
            options: ["86", "85", "87", "84"],
            correctAnswer: "86",
            explanation: "93 − 7 = 86. Evaluates sustained mathematical calculation under working memory load.",
            score: 1
        },
        {
            id: 16,
            section: "Attention & Calculation",
            domain: "Attention & Calculation",
            question: "Continuing serial subtraction: What is 86 − 7?",
            options: ["79", "78", "80", "77"],
            correctAnswer: "79",
            explanation: "86 − 7 = 79. Evaluates sequential computational tracking.",
            score: 1
        },
        {
            id: 17,
            section: "Attention & Calculation",
            domain: "Attention & Calculation",
            question: "Continuing serial subtraction: What is 79 − 7?",
            options: ["72", "71", "73", "74"],
            correctAnswer: "72",
            explanation: "79 − 7 = 72. Evaluates serial arithmetic attention.",
            score: 1
        },
        {
            id: 18,
            section: "Attention & Calculation",
            domain: "Attention & Calculation",
            question: "Reverse Sequencing: Spell the word 'WORLD' backwards.",
            image: "/images/world.jpg",
            options: ["DLROW", "DLRWO", "DOWRL", "DRLOW"],
            correctAnswer: "DLROW",
            explanation: "'W-O-R-L-D' backwards is 'D-L-R-O-W'. Standard MMSE test for working memory manipulation.",
            score: 1
        },

        // 5️⃣ Recall (Delayed Memory Sharpness) (3 Questions)
        {
            id: 19,
            section: "Recall (Memory Sharpness)",
            domain: "Delayed Recall",
            question: "Memory Sharpness 1/3: Recall the fruit memorized earlier before the math calculation.",
            image: "/images/apple.jpg",
            options: ["Apple", "Banana", "Mango", "Orange"],
            correctAnswer: "Apple",
            explanation: "Target was 'Apple'. Tests delayed retrieval after distraction — key marker of memory sharpness.",
            score: 1
        },
        {
            id: 20,
            section: "Recall (Memory Sharpness)",
            domain: "Delayed Recall",
            question: "Memory Sharpness 2/3: Recall the furniture item from the registration list earlier.",
            options: ["Table", "Chair", "Sofa", "Desk"],
            correctAnswer: "Table",
            explanation: "Target was 'Table'. Tests hippocampal consolidation and delayed retrieval.",
            score: 1
        },
        {
            id: 21,
            section: "Recall (Memory Sharpness)",
            domain: "Delayed Recall",
            question: "Memory Sharpness 3/3: Recall the vehicle from the registration list earlier.",
            options: ["Car", "Bus", "Train", "Bicycle"],
            correctAnswer: "Car",
            explanation: "Target was 'Car'. Completes 3-item delayed recall testing memory sharpness.",
            score: 1
        },

        // 6️⃣ Language Skills (6 Questions)
        {
            id: 22,
            section: "Language",
            domain: "Language",
            question: "Identify the object shown in the image primarily used to cut paper.",
            image: "/images/scissors.png",
            options: ["Scissors", "Knife", "Spoon", "Pen"],
            correctAnswer: "Scissors",
            explanation: "Object confrontation naming — 'Scissors'. Tests semantic recognition.",
            score: 1
        },
        {
            id: 23,
            section: "Language",
            domain: "Language",
            question: "Which of these words describes an action (verb)?",
            image: "/images/running.jpg",
            options: ["Run", "Table", "Chair", "Pen"],
            correctAnswer: "Run",
            explanation: "'Run' is an action verb. Evaluates grammatical category identification.",
            score: 1
        },
        {
            id: 24,
            section: "Language",
            domain: "Language",
            question: "Choose the grammatically correct English sentence.",
            options: ["She goes to school", "She go to school", "She going school", "She gone school"],
            correctAnswer: "She goes to school",
            explanation: "Subject-verb agreement: 'She goes to school'. Tests syntax comprehension.",
            score: 1
        },
        {
            id: 25,
            section: "Language",
            domain: "Language",
            question: "What does the imperative phrase 'Close the door' instruct you to do?",
            image: "/images/door.jpg",
            options: ["Shut door", "Open door", "Break door", "Lock door"],
            correctAnswer: "Shut door",
            explanation: "Instruction comprehension: 'Close' means 'Shut'. Evaluates language semantics.",
            score: 1
        },
        {
            id: 26,
            section: "Language",
            domain: "Language",
            question: "Identify the writing instrument shown in the clinical image.",
            image: "/images/pen.jpg",
            options: ["Pen", "Plate", "Glass", "Spoon"],
            correctAnswer: "Pen",
            explanation: "Confrontation naming — 'Pen'. Tests lexical retrieval.",
            score: 1
        },
        {
            id: 27,
            section: "Language",
            domain: "Language",
            question: "Which primary color is predominantly displayed in the clinical image?",
            image: "/images/blue.jpg",
            options: ["Blue", "Yellow", "Green", "Red"],
            correctAnswer: "Blue",
            explanation: "Visual color recognition and naming — 'Blue'.",
            score: 1
        },

        // 7️⃣ Visuospatial Ability (3 Questions)
        {
            id: 28,
            section: "Visuospatial",
            domain: "Visuospatial",
            question: "Which geometric regular polygon has four equal straight sides?",
            image: "/images/square.jpg",
            options: ["Square", "Triangle", "Circle", "Pentagon"],
            correctAnswer: "Square",
            explanation: "A square has four equal sides and 90-degree angles. Evaluates geometric reasoning.",
            score: 1
        },
        {
            id: 29,
            section: "Visuospatial",
            domain: "Visuospatial",
            question: "Which geometric figure has a continuous round perimeter with no corners, like the globe?",
            image: "/images/world.jpg",
            options: ["Circle", "Square", "Triangle", "Rectangle"],
            correctAnswer: "Circle",
            explanation: "A circle has no vertices. Evaluates visual form discrimination.",
            score: 1
        },
        {
            id: 30,
            section: "Visuospatial",
            domain: "Visuospatial",
            question: "Observe the clinical figure: Which description accurately depicts the overlapping shapes?",
            image: React.createElement(OverlappingPentagons),
            options: ["Two overlapping pentagons", "Two separate squares", "A circle inside a box", "Two separate triangles"],
            correctAnswer: "Two overlapping pentagons",
            explanation: "Overlapping intersecting 5-sided pentagons — standard MMSE visual construction task.",
            score: 1
        }
    ];

    // Shuffle options for every question so order is randomized per session
    return baseQuestions.map((q) => ({
        ...q,
        options: shuffleArray(q.options)
    }));
}

// ─── MoCA Diagnostic Questions ───────────────────────────────────────────────
export function getMoCAQuestions(date = new Date()) {
    const dyn = getDynamicOrientationData(date);

    const baseQuestions = [
        // 1️⃣ Visuospatial / Executive (5 Questions)
        {
            id: 1,
            section: "Visuospatial / Executive",
            domain: "Visuospatial / Executive",
            question: "In a 3D isometric cube drawing, how many exterior faces are directly visible?",
            image: "/cube.png",
            options: ["3", "1", "2", "4"],
            correctAnswer: "3",
            explanation: "From an isometric perspective, exactly 3 faces of a cube are visible (top, front, side).",
            score: 1
        },
        {
            id: 2,
            section: "Visuospatial / Executive",
            domain: "Visuospatial / Executive",
            question: "Identify the geometric shape shown in high-contrast.",
            image: "/red_circle.png",
            options: ["Circle", "Triangle", "Square", "Oval"],
            correctAnswer: "Circle",
            explanation: "Standard high-contrast circle. Tests basic shape discrimination.",
            score: 1
        },
        {
            id: 3,
            section: "Visuospatial / Executive",
            domain: "Visuospatial / Executive",
            question: "Evaluate the analog clock: What time is indicated by the hands?",
            image: "/clock.png",
            options: ["11:00", "10:11", "12:10", "11:10"],
            correctAnswer: "11:00",
            explanation: "Hour hand at 11, minute hand at 12 indicates 11:00.",
            score: 1
        },
        {
            id: 4,
            section: "Visuospatial / Executive",
            domain: "Visuospatial / Executive",
            question: "What color is shown in the clinical swatch above?",
            image: "/images/red.jpg",
            options: ["Red", "Blue", "Green", "Yellow"],
            correctAnswer: "Red",
            explanation: "Primary hue discrimination — 'Red'.",
            score: 1
        },
        {
            id: 5,
            section: "Visuospatial / Executive",
            domain: "Visuospatial / Executive",
            question: "What numeric digit is presented in the visual stimulus?",
            image: "/digit4.png",
            options: ["4", "3", "5", "6"],
            correctAnswer: "4",
            explanation: "Grapheme identification — digit '4'.",
            score: 1
        },

        // 2️⃣ Naming (3 Questions)
        {
            id: 6,
            section: "Naming",
            domain: "Naming",
            question: "Identify the apex predator mammal shown in the image.",
            image: "/images/lion.jpg",
            options: ["Lion", "Tiger", "Leopard", "Wolf"],
            correctAnswer: "Lion",
            explanation: "MoCA confrontation naming: 'Lion'. Evaluates lexical access.",
            score: 1
        },
        {
            id: 7,
            section: "Naming",
            domain: "Naming",
            question: "Identify the horned bovine animal shown in the clinical image.",
            image: "/animal_horn.png",
            options: ["Buffalo", "Rhino", "Elephant", "Cow"],
            correctAnswer: "Buffalo",
            explanation: "Animal naming — 'Buffalo / Rhinoceros'. Tests visual confrontation naming.",
            score: 1
        },
        {
            id: 8,
            section: "Naming",
            domain: "Naming",
            question: "Identify the desert-adapted animal shown in the image.",
            image: "/camel.png",
            options: ["Camel", "Horse", "Donkey", "Goat"],
            correctAnswer: "Camel",
            explanation: "MoCA confrontation naming: 'Camel'.",
            score: 1
        },

        // 3️⃣ Memory (Immediate Encoding) (5 Questions)
        {
            id: 9,
            section: "Memory Registration",
            domain: "Registration",
            question: "Memory Registration (1/5): Memorize the 5 words: 'FACE, VELVET, CHURCH, DAISY, RED'. What was word #1?",
            image: "/images/face.jpg",
            options: ["Face", "Chair", "Table", "Bottle"],
            correctAnswer: "Face",
            explanation: "Word 1: 'Face'. Memorize this word — you will be tested on it again in delayed recall!",
            score: 1
        },
        {
            id: 10,
            section: "Memory Registration",
            domain: "Registration",
            question: "Memory Registration (2/5): In the list 'FACE, VELVET, CHURCH, DAISY, RED', which word is a fabric?",
            options: ["Velvet", "Silk", "Cotton", "Wool"],
            correctAnswer: "Velvet",
            explanation: "Word 2: 'Velvet'. Memorize this word for delayed recall testing!",
            score: 1
        },
        {
            id: 11,
            section: "Memory Registration",
            domain: "Registration",
            question: "Memory Registration (3/5): In the list 'FACE, VELVET, CHURCH, DAISY, RED', which place of worship appeared?",
            options: ["Church", "Temple", "Mosque", "Library"],
            correctAnswer: "Church",
            explanation: "Word 3: 'Church'. Keep this in working memory for delayed testing.",
            score: 1
        },
        {
            id: 12,
            section: "Memory Registration",
            domain: "Registration",
            question: "Memory Registration (4/5): In the list 'FACE, VELVET, CHURCH, DAISY, RED', which flower appeared?",
            options: ["Daisy", "Rose", "Lily", "Sunflower"],
            correctAnswer: "Daisy",
            explanation: "Word 4: 'Daisy'.",
            score: 1
        },
        {
            id: 13,
            section: "Memory Registration",
            domain: "Registration",
            question: "Memory Registration (5/5): In the list 'FACE, VELVET, CHURCH, DAISY, RED', which color appeared?",
            options: ["Red", "Blue", "Green", "Yellow"],
            correctAnswer: "Red",
            explanation: "Word 5: 'Red'. You have registered all 5 words. Intervening tasks will follow before delayed recall.",
            score: 1
        },

        // 4️⃣ Attention & Working Memory (6 Questions)
        {
            id: 14,
            section: "Attention",
            domain: "Attention",
            question: "Mental Arithmetic: What is 20 + 5?",
            options: ["25", "24", "23", "26"],
            correctAnswer: "25",
            explanation: "20 + 5 = 25.",
            score: 1
        },
        {
            id: 15,
            section: "Attention",
            domain: "Attention",
            question: "Mental Arithmetic: What is 30 − 4?",
            options: ["26", "27", "25", "28"],
            correctAnswer: "26",
            explanation: "30 − 4 = 26.",
            score: 1
        },
        {
            id: 16,
            section: "Attention",
            domain: "Attention",
            question: "Sequence Progression: What number comes next in: 2, 4, 6, 8, __?",
            options: ["10", "9", "11", "12"],
            correctAnswer: "10",
            explanation: "Progression by +2 gives 10.",
            score: 1
        },
        {
            id: 17,
            section: "Attention",
            domain: "Attention",
            question: "Numerical Discrimination: Which of these numbers has the highest value?",
            options: ["17", "12", "15", "14"],
            correctAnswer: "17",
            explanation: "17 is the maximum number.",
            score: 1
        },
        {
            id: 18,
            section: "Attention",
            domain: "Attention",
            question: "Mental Arithmetic: What is 15 + 3?",
            options: ["18", "17", "16", "19"],
            correctAnswer: "18",
            explanation: "15 + 3 = 18.",
            score: 1
        },
        {
            id: 19,
            section: "Attention",
            domain: "Attention",
            question: "Letter Count: How many letters are in the word 'APPLE'?",
            options: ["5", "4", "6", "7"],
            correctAnswer: "5",
            explanation: "A-P-P-L-E contains 5 letters.",
            score: 1
        },

        // 5️⃣ Language (3 Questions)
        {
            id: 20,
            section: "Language",
            domain: "Language",
            question: "Which of these sentences is grammatically correct?",
            options: ["She goes to school", "She go to school", "She going school", "She gone school"],
            correctAnswer: "She goes to school",
            explanation: "Correct present tense syntax.",
            score: 1
        },
        {
            id: 21,
            section: "Language",
            domain: "Language",
            question: "Antonym Identification: Which word is the exact opposite of 'cold'?",
            options: ["Hot", "Warm", "Cool", "Freeze"],
            correctAnswer: "Hot",
            explanation: "'Hot' is the direct antonym of 'cold'.",
            score: 1
        },
        {
            id: 22,
            section: "Language",
            domain: "Language",
            question: "Grammatical Category: Which word in this list is an action verb?",
            options: ["Run", "Table", "Chair", "Door"],
            correctAnswer: "Run",
            explanation: "'Run' is an action verb.",
            score: 1
        },

        // 6️⃣ Abstraction (2 Questions)
        {
            id: 23,
            section: "Abstraction",
            domain: "Abstraction",
            question: "Conceptual Similarity: What is the primary functional category linking a train and a bicycle?",
            options: ["Both are transport vehicles", "Both are animals", "Both are buildings", "Both are foods"],
            correctAnswer: "Both are transport vehicles",
            explanation: "High-level conceptual abstract categorization: vehicles of transportation.",
            score: 1
        },
        {
            id: 24,
            section: "Abstraction",
            domain: "Abstraction",
            question: "Conceptual Similarity: What connects a watch and a clock?",
            options: ["Both measure and display time", "Both are food items", "Both are living organisms", "Both are furniture"],
            correctAnswer: "Both measure and display time",
            explanation: "Functional abstraction: horological instruments.",
            score: 1
        },

        // 7️⃣ Delayed Recall (Memory Sharpness) (5 Questions)
        {
            id: 25,
            section: "Delayed Recall (Memory Sharpness)",
            domain: "Delayed Recall",
            question: "Memory Sharpness 1/5: Recall the first word from the 5-item memory list memorized earlier.",
            options: ["Face", "Bottle", "Chair", "Door"],
            correctAnswer: "Face",
            explanation: "Target was 'Face'. Tests spontaneous delayed retrieval.",
            score: 1
        },
        {
            id: 26,
            section: "Delayed Recall (Memory Sharpness)",
            domain: "Delayed Recall",
            question: "Memory Sharpness 2/5: Recall the fabric from the memory list memorized earlier.",
            options: ["Velvet", "Cotton", "Silk", "Wool"],
            correctAnswer: "Velvet",
            explanation: "Target was 'Velvet'. Tests delayed memory sharpness with category cues.",
            score: 1
        },
        {
            id: 27,
            section: "Delayed Recall (Memory Sharpness)",
            domain: "Delayed Recall",
            question: "Memory Sharpness 3/5: Recall the place of worship from the memory list memorized earlier.",
            options: ["Church", "Temple", "Mosque", "School"],
            correctAnswer: "Church",
            explanation: "Target was 'Church'. Evaluates episodic memory retention.",
            score: 1
        },
        {
            id: 28,
            section: "Delayed Recall (Memory Sharpness)",
            domain: "Delayed Recall",
            question: "Memory Sharpness 4/5: Recall the flower from the memory list memorized earlier.",
            options: ["Daisy", "Rose", "Lily", "Tulip"],
            correctAnswer: "Daisy",
            explanation: "Target was 'Daisy'. Assesses delayed memory consolidation.",
            score: 1
        },
        {
            id: 29,
            section: "Delayed Recall (Memory Sharpness)",
            domain: "Delayed Recall",
            question: "Memory Sharpness 5/5: Recall the color from the memory list memorized earlier.",
            options: ["Red", "Blue", "Green", "Yellow"],
            correctAnswer: "Red",
            explanation: "Target was 'Red'. Completes the 5-item delayed recall evaluation.",
            score: 1
        },

        // 8️⃣ Orientation (1 Question)
        {
            id: 30,
            section: "Orientation",
            domain: "Orientation",
            question: "Orientation Check: What year is it currently?",
            options: dyn.year.options,
            correctAnswer: dyn.year.correctAnswer,
            explanation: `Current year is ${dyn.year.correctAnswer}.`,
            score: 1
        }
    ];

    return baseQuestions.map((q) => ({
        ...q,
        options: shuffleArray(q.options)
    }));
}

// Default dynamic questions instances
export const mmseQuestions = getMMSEQuestions();
export const mocaQuestions = getMoCAQuestions();

// Helper Functions
export function calculateScore(answers, questions) {
    let totalScore = 0;
    questions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) {
            totalScore += q.score;
        }
    });
    return totalScore;
}

export function interpretMMSE(score) {
    if (score >= 24) return { level: "Normal", interpretation: "Normal cognitive functioning within typical normative range.", color: "#10b981" };
    if (score >= 18) return { level: "Mild", interpretation: "Mild cognitive impairment detected. Clinical follow-up recommended.", color: "#f59e0b" };
    return { level: "Severe", interpretation: "Significant impairment detected. Formal neurological assessment strongly advised.", color: "#ef4444" };
}

export function interpretMOCA(score) {
    if (score >= 26) return { level: "Normal", interpretation: "Normal cognitive performance; executive and memory functions intact.", color: "#10b981" };
    if (score >= 18) return { level: "Mild", interpretation: "Mild cognitive changes noted. Neuropsychological tracking suggested.", color: "#f59e0b" };
    return { level: "Severe", interpretation: "Elevated dementia risk detected. Immediate medical consultation recommended.", color: "#ef4444" };
}

/**
 * Breakdown by cognitive domains
 */
export function getDomainBreakdown(answers, questions) {
    const domainMap = {};
    questions.forEach((q) => {
        const d = q.domain || q.section || "General";
        if (!domainMap[d]) {
            domainMap[d] = { domain: d, correct: 0, total: 0 };
        }
        domainMap[d].total += q.score;
        if (answers[q.id] === q.correctAnswer) {
            domainMap[d].correct += q.score;
        }
    });

    return Object.values(domainMap).map((d) => ({
        ...d,
        percent: Math.round((d.correct / d.total) * 100),
        status: d.correct === d.total ? "Intact" : (d.correct / d.total >= 0.6 ? "Mild Dip" : "Area of Concern")
    }));
}

/**
 * Specifically computes delayed recall memory sharpness
 */
export function getMemorySharpnessStats(answers, questions) {
    const recallQuestions = questions.filter(q => q.domain === "Delayed Recall");
    if (recallQuestions.length === 0) return null;

    let correct = 0;
    recallQuestions.forEach(q => {
        if (answers[q.id] === q.correctAnswer) correct++;
    });

    const total = recallQuestions.length;
    const percent = Math.round((correct / total) * 100);

    return {
        score: correct,
        total,
        percent,
        rating: percent >= 80 ? "Sharp & Resilient" : (percent >= 50 ? "Moderate Retention" : "Reduced Retention"),
        note: percent >= 80
            ? "Your delayed recall demonstrates strong memory consolidation even after distracting arithmetic and attention tasks."
            : "Delayed recall scores show vulnerability to interference. Targeted memory retrieval exercises are advised."
    };
}

/**
 * Clinically targeted recommendations based on missed domains
 */
export function generateClinicalSuggestions(answers, questions, testType = "MMSE") {
    const breakdown = getDomainBreakdown(answers, questions);
    const suggestions = [];

    const missedDomains = breakdown.filter(b => b.percent < 100);

    // Domain-specific advice
    missedDomains.forEach(b => {
        if (b.domain === "Delayed Recall") {
            suggestions.push({
                domain: "Memory Sharpness & Delayed Recall",
                severity: b.percent < 50 ? "high" : "medium",
                recommendation: "Practice spaced-retrieval techniques and associative memory mnemonics. Daily journaling and evening recap of morning events helps strengthen hippocampal consolidation."
            });
        } else if (b.domain === "Attention & Calculation" || b.domain === "Attention") {
            suggestions.push({
                domain: "Attention & Working Memory",
                severity: b.percent < 60 ? "high" : "medium",
                recommendation: "Engage in 10 minutes of daily mental arithmetic (counting backwards from 100 by 7s or 3s) and working-memory puzzle apps (dual n-back training)."
            });
        } else if (b.domain === "Orientation") {
            suggestions.push({
                domain: "Temporal & Spatial Orientation",
                severity: b.percent < 70 ? "high" : "medium",
                recommendation: "Keep a high-contrast calendar clock in common living spaces. Form a morning habit of verbalizing the day, date, month, and season."
            });
        } else if (b.domain === "Visuospatial" || b.domain === "Visuospatial / Executive") {
            suggestions.push({
                domain: "Visuospatial & Executive Construction",
                severity: "medium",
                recommendation: "Perform clock drawing exercises, 3D geometric shape sketching, and jigsaw or tangram puzzles to stimulate parietal lobe circuits."
            });
        } else if (b.domain === "Language" || b.domain === "Naming") {
            suggestions.push({
                domain: "Language & Semantic Retrieval",
                severity: "medium",
                recommendation: "Practice speed-naming exercises (e.g., naming 15 animals or fruits within 60 seconds), reading aloud, and crossword puzzles."
            });
        }
    });

    // Baseline lifestyle neuroprotective suggestions
    suggestions.push({
        domain: "Lifestyle & Neuroprotection",
        severity: "low",
        recommendation: "Adopt a Mediterranean-MIND diet rich in leafy greens and omega-3s, maintain 150 minutes of moderate aerobic exercise weekly, and ensure 7-8 hours of uninterrupted sleep."
    });

    // Medical consultation flag if overall score is reduced
    const rawScore = calculateScore(answers, questions);
    const maxScore = questions.reduce((acc, q) => acc + q.score, 0);
    if ((rawScore / maxScore) < 0.8) {
        suggestions.unshift({
            domain: "Neurological Follow-Up",
            severity: "high",
            recommendation: "Your score suggests mild cognitive variance. We recommend booking a teleconsultation with our specialist neurologists for comprehensive volumetric MRI and clinical review."
        });
    }

    return suggestions;
}
