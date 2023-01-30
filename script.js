let promptOne;
let promptTwo;
let language = undefined;
let prompts;
let API_KEY;

const submitAPIButton = document.getElementById('submitKey');

submitAPIButton.addEventListener('click', (e) => {
    e.preventDefault();
    const apiKey = document.getElementById('apiKey').value;
    document.cookie = `oaiapik=${apiKey}`;
});

function getCookie(name) {
    let value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}
//const API_KEY = getCookie("oaiapik");

let presetSelector = document.querySelector("#presetSelect");
let presetError = document.querySelector("#presetErrorWrap");
let presetErrorMessage = document.querySelector("#presetError");

function setPrompts(prompt1, prompt2) {
    prompts = [prompt1, prompt2];
}

presetSelector.addEventListener("change", () => {
    let globalVal = presetSelector.value;
    let langOptions = document.querySelector("#langOptionsWrap");

    if(globalVal === "translation") {
        langOptions.style.display = "flex";
        presetError.style.display = "none";
        promptOne = undefined;
        promptTwo = undefined;

        let langSelected = document.querySelector("#langOptions")

        langSelected.addEventListener("change", () => {
            language = langSelected.value;
            promptOne = `Translate this: '`;
            promptTwo = `' into ${language} language`;
            
            setPrompts(promptOne, promptTwo);
        });
        
    } else if(globalVal === "categorization") {
        langOptions.style.display = "none";
        presetError.style.display = "none";
        promptOne = `The following is a keyword and the category it falls into: '`;
        promptTwo = `' Category: `;
    } else {
        langOptions.style.display = "none";
        promptOne = undefined;
        promptTwo = undefined;
    }
    setPrompts(promptOne, promptTwo);
});

const startButton = document.getElementById("startBtn");
startButton.addEventListener("click", categorizeKeywords);

function categorizeKeywords() {
    API_KEY = getCookie("oaiapik")
    //try {
        let [promptPt1, promptPt2] = prompts;

        /*if (!prompts.ok) {
            throw new Error(prompts.statusText);
        }*/

    let keywords = document.getElementById("keywords").value.split("\n");

    keywords = keywords.filter(function (keyword) {
        return keyword.trim() !== "";
    });
    keywords = [...new Set(keywords)];

    // limit the number of keywords to 100
    if (keywords.length > 100) {
        keywords = keywords.slice(0, 100);
    }

    // Show loading message
    const loadingMessages = [
        "Loading your keywords, hold on tight!",
        "Hang on, we're getting your keywords ready!",
        "Your keywords are on their way, just a moment!",
        "Loading... Just a few more seconds!",
        "Please wait while we categorize your keywords."
    ];

    let randomIndex = Math.floor(Math.random() * loadingMessages.length);
    let loadingMessage = loadingMessages[randomIndex];
    document.getElementById("loadingMessage").innerText = loadingMessage;

    const keywordTable = document.getElementById("keywordTable");
    keywordTable.style.display = "table";
    let downloadCSV = document.getElementById("downloadTable");

    if(document.getElementById("keywordTable").style.display === 'table'){
        document.getElementById("loadingMessage").style.display = 'none';
        downloadCSV.style.display = "block";
    };

    Promise.all(keywords.map(async keyword => {
        try {
            const response = await fetch('https://api.openai.com/v1/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "text-davinci-003",
                    prompt: promptPt1 + keyword + promptPt2,
                    max_tokens: 64,
                    temperature: 0.5,
                    top_p: 1.0,
                    frequency_penalty: 0.0,
                    presence_penalty: 0.0
                })
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const response_1_data = await response.json();
            return {
                keyword: keyword,
                category: response_1_data.choices[0].text
            };
    
        } catch (error) {
            console.log(`Error: ${error}`);
        }
    })).then(response_1_data => {
        const keywordTableBody = document.getElementById("keywordTableBody");
        keywordTableBody.innerHTML = "";
        response_1_data.forEach(function (item) {
            if (item.category !== "No category found"){
                let row = keywordTableBody.insertRow();
                let keywordCell = row.insertCell(0);
                let categoryCell = row.insertCell(1);
                keywordCell.innerHTML = item.keyword;
                categoryCell.innerHTML = item.category;
            } else {
                let row = keywordTableBody.insertRow();
                let keywordCell = row.insertCell(0);
                let categoryCell = row.insertCell(1);
                keywordCell.innerHTML = item.keyword;
                categoryCell.innerHTML = "No category found";
            }
        });
        if(document.getElementById("keywordTable").style.display === 'table'){
            document.getElementById("loadingMessage").style.display = 'none';
            downloadCSV.style.display = "block";
        };        
    });

    downloadCSV.addEventListener("click", () => {
        let data = [];

        for (let i = 0, row; row = keywordTable.rows[i]; i++) {
            let rowData = [];

            for (let j = 0, col; col = row.cells[j]; j++) {
                rowData.push(col.innerText);
            }

            data.push(rowData);
        }
            
        let csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
        encodedUri = encodeURI(csvContent);
        link = document.getElementById("downloadLink");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "table.csv");
    });
    /*} catch (error) {
        console.log(`Error: ${error}`);
        presetErrorMessage.innerText = error;
        presetError.style.display = "block";
    }*/
}