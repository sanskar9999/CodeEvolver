let currentPage = null;

async function fetchGroqResponse(prompt) {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });
    return await response.json();
}

function createPage(html) {
    const page = document.createElement('iframe');
    page.srcdoc = html;
    page.className = 'w-full h-96 border rounded';
    return page;
}

async function evolve(prompt) {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      const page = createPage(data.content);
      document.getElementById('pagesContainer').appendChild(page);
      currentPage = page;
    } catch (error) {
      console.error('Error evolving:', error);
      // Handle the error in UI
    }
  }

document.getElementById('startNewBtn').addEventListener('click', () => {
    document.getElementById('start-window').style.display = 'flex';
});

document.getElementById('startEvolvingBtn').addEventListener('click', async () => {
    const prompt = document.getElementById('startPrompt').value;
    document.getElementById('start-window').style.display = 'none';
    await evolve(prompt);
});

document.getElementById('temperature').addEventListener('input', (e) => {
    console.log('Temperature:', e.target.value);
    // You can use this value when sending requests to the Groq API
});

document.getElementById('zoomOut').addEventListener('input', (e) => {
    if (currentPage) {
        currentPage.style.transform = `scale(${e.target.value})`;
    }
});
