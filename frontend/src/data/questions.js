import React from 'react';
import { OverlappingPentagons } from '../components/ClinicalVisuals';

// MMSE and MoCA diagnostic questions structured for automated screening
// Context: Today is Friday, March 6, 2026 (Spring)

export const mmseQuestions = [
    // 1️⃣ Orientation to Time (5 Questions)
    {
        id: 1,
        section: "Orientation to Time",
        question: "What year is it right now?",
        image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400",
        options: ["2024", "2025", "2026", "2027"],
        correctAnswer: "2026",
        score: 1
    },
    {
        id: 2,
        section: "Orientation to Time",
        question: "What season is it currently?",
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
        options: ["Winter", "Spring", "Summer", "Autumn"],
        correctAnswer: "Spring",
        score: 1
    },
    {
        id: 3,
        section: "Orientation to Time",
        question: "What month is it right now?",
        image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400",
        options: ["January", "February", "March", "April"],
        correctAnswer: "March",
        score: 1
    },
    {
        id: 4,
        section: "Orientation to Time",
        question: "What day of the week is today?",
        options: ["Wednesday", "Thursday", "Friday", "Saturday"],
        correctAnswer: "Friday",
        score: 1
    },
    {
        id: 5,
        section: "Orientation to Time",
        question: "What is today's date?",
        options: ["4th", "5th", "6th", "7th"],
        correctAnswer: "6th",
        score: 1
    },

    // 2️⃣ Orientation to Place (5 Questions)
    {
        id: 6,
        section: "Orientation to Place",
        question: "What country are you currently in?",
        image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400",
        options: ["India", "USA", "UK", "Canada"],
        correctAnswer: "India",
        score: 1
    },
    {
        id: 7,
        section: "Orientation to Place",
        question: "What state are you currently in?",
        options: ["Maharashtra", "Gujarat", "Karnataka", "Delhi"],
        correctAnswer: "Maharashtra",
        score: 1
    },
    {
        id: 8,
        section: "Orientation to Place",
        question: "In what city are you currently?",
        options: ["Mumbai", "Pune", "Nashik", "Thane"],
        correctAnswer: "Mumbai",
        score: 1
    },
    {
        id: 9,
        section: "Orientation to Place",
        question: "In which district or county are we currently located?",
        image: "https://images.unsplash.com/photo-1570160897548-394f9f08bd05?w=400",
        options: ["Mumbai Suburban", "Pune", "Thane", "Nashik"],
        correctAnswer: "Mumbai Suburban",
        score: 1
    },
    {
        id: 10,
        section: "Orientation to Place",
        question: "Please confirm your full name for identity orientation.",
        image: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400",
        options: ["Dhruv Gharat", "John Doe", "Jane Smith", "Will Smith"],
        correctAnswer: "Dhruv Gharat", // Default matches the current dashboard/sidebar state
        score: 1,
        isDynamic: true // Marker for frontend to potentially override based on auth state
    },

    // 3️⃣ Registration (Immediate Memory) (3 Questions)
    {
        id: 11,
        section: "Registration",
        question: "Which word was identifying a fruit in the list provided (Apple, Table, Car)?",
        image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6bccb?w=400",
        options: ["Apple", "Banana", "Orange", "Mango"],
        correctAnswer: "Apple",
        score: 1
    },
    {
        id: 12,
        section: "Registration",
        question: "Which object identifying furniture was in the list?",
        image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400",
        options: ["Table", "Chair", "Desk", "Cupboard"],
        correctAnswer: "Table",
        score: 1
    },
    {
        id: 13,
        section: "Registration",
        question: "Which vehicle was identified in the list?",
        image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400",
        options: ["Car", "Bus", "Train", "Bicycle"],
        correctAnswer: "Car",
        score: 1
    },

    // 4️⃣ Attention & Calculation (5 Questions)
    {
        id: 14,
        section: "Attention & Calculation",
        question: "What is 100 − 7?",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400",
        options: ["93", "94", "92", "91"],
        correctAnswer: "93",
        score: 1
    },
    {
        id: 15,
        section: "Attention & Calculation",
        question: "Continuing subtraction: What is 93 − 7?",
        options: ["86", "85", "87", "84"],
        correctAnswer: "86",
        score: 1
    },
    {
        id: 16,
        section: "Attention & Calculation",
        question: "Continuing subtraction: What is 86 − 7?",
        options: ["79", "78", "80", "77"],
        correctAnswer: "79",
        score: 1
    },
    {
        id: 17,
        section: "Attention & Calculation",
        question: "Continuing subtraction: What is 79 − 7?",
        options: ["72", "71", "73", "74"],
        correctAnswer: "72",
        score: 1
    },
    {
        id: 18,
        section: "Attention & Calculation",
        question: "Spell the word 'WORLD' backwards.",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
        options: ["DLROW", "DLRWO", "DOWRL", "DRLOW"],
        correctAnswer: "DLROW",
        score: 1
    },

    // 5️⃣ Recall (Delayed Memory) (3 Questions)
    {
        id: 19,
        section: "Recall",
        question: "Recall the fruit from the earlier list.",
        image: "https://images.unsplash.com/photo-1456324504439-367cef38f074?w=400",
        options: ["Apple", "Banana", "Mango", "Orange"],
        correctAnswer: "Apple",
        score: 1
    },
    {
        id: 20,
        section: "Recall",
        question: "Recall the furniture item from the earlier list.",
        options: ["Table", "Chair", "Sofa", "Desk"],
        correctAnswer: "Table",
        score: 1
    },
    {
        id: 21,
        section: "Recall",
        question: "Recall the vehicle from the earlier list.",
        options: ["Car", "Bus", "Train", "Bicycle"],
        correctAnswer: "Car",
        score: 1
    },

    // 6️⃣ Language Skills (6 Questions)
    {
        id: 22,
        section: "Language",
        question: "Identify the object shown in the image primarily used to cut paper.",
        image: "scis_test.png",
        options: ["Knife", "Scissors", "Spoon", "Pen"],
        correctAnswer: "Scissors",
        score: 1
    },
    {
        id: 23,
        section: "Language",
        question: "Which of these words is a verb?",
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
        options: ["Run", "Table", "Chair", "Pen"],
        correctAnswer: "Run",
        score: 1
    },
    {
        id: 24,
        section: "Language",
        question: "Choose the grammatically correct sentence.",
        options: ["She go to school", "She goes to school", "She going school", "She gone school"],
        correctAnswer: "She goes to school",
        score: 1
    },
    {
        id: 25,
        section: "Language",
        question: "What does the phrase 'Close the door' instruct you to do?",
        image: "https://images.unsplash.com/photo-1506377295352-e3154d43ea9e?w=400",
        options: ["Open door", "Shut door", "Break door", "Lock door"],
        correctAnswer: "Shut door",
        score: 1
    },
    {
        id: 26,
        section: "Language",
        question: "Identify the object in the image primarily used for writing.",
        image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
        options: ["Pen", "Plate", "Glass", "Spoon"],
        correctAnswer: "Pen",
        score: 1
    },
    {
        id: 27,
        section: "Language",
        question: "Which of the following colors is shown in the image?",
        image: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400",
        options: ["Blue", "Yellow", "Green", "Red"],
        correctAnswer: "Blue",
        score: 1
    },

    // 7️⃣ Visuospatial Ability (3 Questions)
    {
        id: 28,
        section: "Visuospatial",
        question: "Which shape shown in the clinical reference has four equal sides?",
        image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400",
        options: ["Triangle", "Square", "Circle", "Pentagon"],
        correctAnswer: "Square",
        score: 1
    },
    {
        id: 29,
        section: "Visuospatial",
        question: "Which geometric shape looks like a globe as shown?",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
        options: ["Square", "Circle", "Triangle", "Rectangle"],
        correctAnswer: "Circle",
        score: 1
    },
    {
        id: 30,
        section: "Visuospatial",
        question: "Observe the pattern of two overlapping shapes. Which description is most accurate?",
        image: React.createElement(OverlappingPentagons),
        options: ["Two squares", "Two overlapping pentagons", "A circle inside a box", "Two separate triangles"],
        correctAnswer: "Two overlapping pentagons",
        score: 1
    }
];

export const mocaQuestions = [
    // 1️⃣ Visuospatial / Executive (5 Questions)
    {
        id: 1,
        section: "Visuospatial / Executive",
        question: "In a 3D cube drawing, evaluate the number of visible faces from this perspective.",
        image: "/cube.png",
        options: ["1", "2", "3", "4"],
        correctAnswer: "3",
        score: 1
    },
    {
        id: 2,
        section: "Visuospatial / Executive",
        question: "Which of the following geometric shapes is shown in high-contrast in the image?",
        image: "/red_circle.png",
        options: ["Triangle", "Square", "Circle", "Oval"],
        correctAnswer: "Circle",
        score: 1
    },
    {
        id: 3,
        section: "Visuospatial / Executive",
        question: "Evaluate the time shown on this clock.",
        image: "/clock.png",
        options: ["11:00", "10:11", "12:10", "11:10"],
        correctAnswer: "11:00",
        score: 1
    },
    {
        id: 4,
        section: "Visuospatial / Executive",
        question: "What color is shown in the clinical image above?",
        image: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400",
        options: ["Red", "Blue", "Green", "Yellow"],
        correctAnswer: "Red",
        score: 1
    },
    {
        id: 5,
        section: "Visuospatial / Executive",
        question: "What digit do you see in the clinical image above?",
        image: "/digit4.png",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
        score: 1
    },

    // 2️⃣ Naming (3 Questions)
    {
        id: 6,
        section: "Naming",
        question: "Identify the animal in the clinical image.",
        image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400",
        options: ["Lion", "Tiger", "Leopard", "Wolf"],
        correctAnswer: "Lion",
        score: 1
    },
    {
        id: 7,
        section: "Naming",
        question: "Identify the animal with the horn as shown.",
        image: "/animal_horn.png",
        options: ["Rhino", "Elephant", "Cow", "Buffalo"],
        correctAnswer: "Buffalo",
        score: 1
    },
    {
        id: 8,
        section: "Naming",
        question: "Identify the clinical image of the desert animal.",
        image: "/camel.png",
        options: ["Camel", "Horse", "Donkey", "Goat"],
        correctAnswer: "Camel",
        score: 1
    },

    // 3️⃣ Memory (Immediate Recall) (5 Questions)
    {
        id: 9,
        section: "Memory (Immediate)",
        question: "Recall: Which word appeared first in the list 'Face – Velvet – Church – Daisy – Red'?",
        image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400",
        options: ["Face", "Chair", "Table", "Bottle"],
        correctAnswer: "Face",
        score: 1
    },
    { id: 10, section: "Memory (Immediate)", question: "Which fabric-related word appeared in the list?", options: ["Velvet", "Silk", "Cotton", "Wool"], correctAnswer: "Velvet", score: 1 },
    { id: 11, section: "Memory (Immediate)", question: "Which place of worship appeared in the list?", options: ["Church", "Temple", "Mosque", "Library"], correctAnswer: "Church", score: 1 },
    { id: 12, section: "Memory (Immediate)", question: "Which flower appeared in the list?", options: ["Daisy", "Rose", "Lily", "Sunflower"], correctAnswer: "Daisy", score: 1 },
    { id: 13, section: "Memory (Immediate)", question: "Which color was mentioned in the list?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Red", score: 1 },

    // 4️⃣ Attention (6 Questions)
    { id: 14, section: "Attention", question: "What is 20 + 5?", options: ["25", "24", "23", "26"], correctAnswer: "25", score: 1 },
    { id: 15, section: "Attention", question: "What is 30 − 4?", options: ["26", "27", "25", "28"], correctAnswer: "26", score: 1 },
    { id: 16, section: "Attention", question: "Which number comes next in the sequence: 2, 4, 6, 8, ?", options: ["9", "10", "11", "12"], correctAnswer: "10", score: 1 },
    { id: 17, section: "Attention", question: "Which of these numbers is the largest?", options: ["12", "17", "15", "14"], correctAnswer: "17", score: 1 },
    { id: 18, section: "Attention", question: "What is 15 + 3?", options: ["18", "17", "16", "19"], correctAnswer: "18", score: 1 },
    { id: 19, section: "Attention", question: "How many letters are there in the word 'APPLE'?", options: ["4", "5", "6", "7"], correctAnswer: "5", score: 1 },

    // 5️⃣ Language (3 Questions)
    { id: 20, section: "Language", question: "Which sentence is grammatically correct?", options: ["She go to school", "She goes to school", "She going school", "She gone school"], correctAnswer: "She goes to school", score: 1 },
    { id: 21, section: "Language", question: "Which word means the opposite of 'cold'?", options: ["Hot", "Warm", "Cool", "Freeze"], correctAnswer: "Hot", score: 1 },
    { id: 22, section: "Language", question: "Which word in the following list is a verb?", options: ["Run", "Table", "Chair", "Door"], correctAnswer: "Run", score: 1 },

    // 6️⃣ Abstraction (2 Questions)
    { id: 23, section: "Abstraction", question: "What is the primary similarity between a train and a bicycle?", options: ["Both are transport", "Both are animals", "Both are buildings", "Both are foods"], correctAnswer: "Both are transport", score: 1 },
    { id: 24, section: "Abstraction", question: "What is the similarity between a watch and a clock?", options: ["Both show time", "Both are food", "Both are animals", "Both are vehicles"], correctAnswer: "Both show time", score: 1 },

    // 7️⃣ Delayed Recall (5 Questions)
    { id: 25, section: "Delayed Recall", question: "Recall: Which word appeared earlier in the memory list?", options: ["Face", "Bottle", "Chair", "Door"], correctAnswer: "Face", score: 1 },
    { id: 26, section: "Delayed Recall", question: "Recall: Which word related to fabric appeared earlier?", options: ["Velvet", "Cotton", "Silk", "Fabric"], correctAnswer: "Velvet", score: 1 },
    { id: 27, section: "Delayed Recall", question: "Recall: Which place of worship appeared earlier?", options: ["Church", "School", "Mall", "Bank"], correctAnswer: "Church", score: 1 },
    { id: 28, section: "Delayed Recall", question: "Recall: Which flower appeared earlier?", options: ["Daisy", "Rose", "Lily", "Tulip"], correctAnswer: "Daisy", score: 1 },
    { id: 29, section: "Delayed Recall", question: "Recall: Which color appeared earlier?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Red", score: 1 },

    // 8️⃣ Orientation (1 Question)
    { id: 30, section: "Orientation", question: "What year is it currently?", options: ["2024", "2025", "2026", "2027"], correctAnswer: "2026", score: 1 }
];

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
    if (score >= 24) return { level: "Normal", interpretation: "Normal cognitive function", color: "#6FCF97" }; // Green
    if (score >= 18) return { level: "Mild", interpretation: "Mild cognitive impairment", color: "#F59E0B" }; // Orange/Amber
    return { level: "Severe", interpretation: "Severe impairment", color: "#EF4444" }; // Red
}

export function interpretMOCA(score) {
    if (score >= 26) return { level: "Normal", interpretation: "Normal cognitive function", color: "#6FCF97" };
    if (score >= 18) return { level: "Mild", interpretation: "Mild cognitive impairment", color: "#F59E0B" };
    return { level: "Severe", interpretation: "Possible dementia risk", color: "#EF4444" };
}
