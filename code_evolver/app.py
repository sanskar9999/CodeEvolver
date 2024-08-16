from flask import Flask, render_template, request, jsonify
from groq import Groq
import json
import base64
from io import StringIO
import sys
import traceback
import types
import matplotlib.pyplot as plt
from matplotlib import animation
import mpld3

app = Flask(__name__)
client = Groq()

def load_past_selections():
    try:
        with open("past_selections.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_past_selections(selections):
    with open("past_selections.json", "w") as f:
        json.dump(selections, f)

def generate_initial_snippets():
    system_prompt = """You are a creative code generator LLM designed to generate innovative Python code snippets that create visually appealing outputs. Your task is to generate three distinct code variations.

Generate code for visually interesting elements such as fractals, 3D shapes, animations, or any creative visual output using Python libraries like matplotlib, plotly, or other visualization libraries.

Format each code snippet within tags: <code1>...</code1>, <code2>...</code2>, <code3>...</code3>.
Provide a brief description for each snippet in tags: <desc1>...</desc1>, <desc2>...</desc2>, <desc3>...</desc3>.

Ensure the code is complete and can run independently. Do not include markdown code fences (```) in your response."""

    return generate_code_snippets(system_prompt)

def generate_variations(selected_code, selected_desc):
    system_prompt = f"""You are a creative code generator LLM designed to create variations of existing Python code snippets. Your task is to generate three slight variations of the provided code, maintaining its core functionality while adding minor improvements or creative touches.

Base code:
<code>
{selected_code}
</code>

Base description: {selected_desc}

Generate three variations of this code, each with minor changes or additions that enhance its visual appeal or functionality. Format each variation within tags: <code1>...</code1>, <code2>...</code2>, <code3>...</code3>.
Provide a brief description for each variation in tags: <desc1>...</desc1>, <desc2>...</desc2>, <desc3>...</desc3>.

Ensure each variation is a complete, runnable Python code snippet. Do not include markdown code fences (```) in your response."""

    return generate_code_snippets(system_prompt)

def generate_code_snippets(system_prompt):
    completion = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Generate the code snippets as instructed."}
        ],
        temperature=0.2,
        max_tokens=8000,
        top_p=1,
        stream=False,
        stop=None,
    )

    return completion.choices[0].message.content

def extract_code_and_descriptions(content):
    import re
    codes = re.findall(r'<code(\d)>(.*?)</code\1>', content, re.DOTALL)
    descs = re.findall(r'<desc(\d)>(.*?)</desc\1>', content, re.DOTALL)
    return [(code[1].strip(), desc[1].strip()) for code, desc in zip(codes, descs)]

def execute_code(code):
    old_stdout = sys.stdout
    redirected_output = sys.stdout = StringIO()
    try:
        # Create a new module to execute the code
        mod = types.ModuleType("__main__")
        mod.__dict__.update(globals())
        
        # Execute the code in the new module's namespace
        exec(code, mod.__dict__)
        
        # If there's a plt object, convert it to HTML
        if 'plt' in mod.__dict__:
            plt = mod.__dict__['plt']
            fig = plt.gcf()
            html = mpld3.fig_to_html(fig)
            plt.close(fig)
            return html
        
        # If there's an animation object, save it as HTML
        if 'animation' in mod.__dict__:
            animation = mod.__dict__['animation']
            html = animation.to_jshtml()
            return html
        
        sys.stdout = old_stdout
        return redirected_output.getvalue()
    except Exception as e:
        sys.stdout = old_stdout
        return f"Error: {str(e)}\n{traceback.format_exc()}"

@app.route('/')
def index():
    return render_template('index.html', snippets=[], past_selections=load_past_selections())

@app.route('/generate', methods=['POST'])
def generate():
    if request.form.get('generate_new'):
        generated_content = generate_initial_snippets()
    elif request.form.get('generate_variations'):
        selected_code = request.form.get('selected_code')
        selected_desc = request.form.get('selected_desc')
        generated_content = generate_variations(selected_code, selected_desc)
    else:
        return jsonify({"error": "Invalid request"})

    snippets = extract_code_and_descriptions(generated_content)
    return jsonify({"snippets": snippets})

@app.route('/execute', methods=['POST'])
def execute():
    code = request.form.get('code')
    output = execute_code(code)
    return jsonify({"output": output})

@app.route('/select', methods=['POST'])
def select():
    code = request.form.get('code')
    desc = request.form.get('desc')
    past_selections = load_past_selections()
    past_selections.append((code, desc))
    save_past_selections(past_selections)
    return jsonify({"message": "Code selected and saved successfully"})

if __name__ == '__main__':
    app.run(debug=True)