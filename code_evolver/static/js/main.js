document.addEventListener('DOMContentLoaded', () => {
    const generateNewBtn = document.getElementById('generateNew');
    const generateVariationsBtn = document.getElementById('generateVariations');
    const snippetsContainer = document.getElementById('snippetsContainer');
    const outputContainer = document.getElementById('outputContainer');
    const pastSelectionsList = document.getElementById('pastSelections');

    let selectedCode = null;
    let selectedDesc = null;

    generateNewBtn.addEventListener('click', () => generateSnippets('generate_new'));
    generateVariationsBtn.addEventListener('click', () => generateSnippets('generate_variations'));

    function generateSnippets(action) {
        const formData = new FormData();
        formData.append(action, 'true');
        if (action === 'generate_variations') {
            formData.append('selected_code', selectedCode);
            formData.append('selected_desc', selectedDesc);
        }

        fetch('/generate', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            displaySnippets(data.snippets);
        })
        .catch(error => console.error('Error:', error));
    }

    function displaySnippets(snippets) {
        snippetsContainer.innerHTML = '';
        snippets.forEach((snippet, index) => {
            const [code, desc] = snippet;
            const snippetDiv = document.createElement('div');
            snippetDiv.className = 'snippet';
            snippetDiv.innerHTML = `
                <h3>Option ${index + 1}: ${desc}</h3>
                <pre><code>${code}</code></pre>
                <button class="execute">Execute</button>
                <button class="select">Select</button>
            `;
            snippetsContainer.appendChild(snippetDiv);

            snippetDiv.querySelector('.execute').addEventListener('click', () => executeCode(code));
            snippetDiv.querySelector('.select').addEventListener('click', () => selectCode(code, desc));
        });
    }

    function executeCode(code) {
        const formData = new FormData();
        formData.append('code', code);

        fetch('/execute', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            outputContainer.innerHTML = data.output;
            // If the output is HTML (e.g., from mpld3), it will be rendered
            // If it's plain text, it will be displayed as is
        })
        .catch(error => console.error('Error:', error));
    }

    function selectCode(code, desc) {
        selectedCode = code;
        selectedDesc = desc;
        generateVariationsBtn.disabled = false;

        const formData = new FormData();
        formData.append('code', code);
        formData.append('desc', desc);

        fetch('/select', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const li = document.createElement('li');
            li.textContent = desc;
            pastSelectionsList.appendChild(li);
        })
        .catch(error => console.error('Error:', error));
    }
});