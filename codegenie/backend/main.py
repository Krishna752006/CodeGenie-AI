from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer # DL Library Developed by Hugging Face

Model_Name = "deepseek-ai/deepseek-coder-1.3b-instruct"  # Model Used
Model_location = "./deepseek_model" # Model Location
OFFLOAD_FOLDER = "./offload" # Loads the Model into ROM if RAM being used is completely filled. Only used for better the loading.

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"   # Set device to GPU if available, otherwise CPU

tokenizer = AutoTokenizer.from_pretrained(Model_Name, cache_dir = Model_location) # Downloads and loads the tokenizer, not the whole model.

model = AutoModelForCausalLM.from_pretrained(
    Model_Name,
    torch_dtype = torch.float16 if DEVICE == "cuda" else torch.float32,  # Makes the usual values from float32 to float16, reducing the data thus making it faster for processing. But Works well only on GPUs.
    device_map = DEVICE,
    offload_folder = OFFLOAD_FOLDER,
    cache_dir = Model_location
).eval() # Disables training-specific behaviors like Droupout, etc.. and puts in evaluating mode.

app = FastAPI()

# Add the CORS middleware to handle cross-origin requests i.e. between different ports
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"], # Allow all domains to make requests to this API
    allow_credentials = True, # Allow credentials such as cookies and authorization headers to be included in requests so that API can recognize the user
    allow_methods = ["*"]  # Allow all HTTP methods: GET, POST, PUT, DELETE, etc.
)

class CodeRequest(BaseModel):
    prompt: str
    max_tokens: int

def format_prompt_with_backticks(user_prompt: str) -> str:
    return (
        f"{user_prompt}\n\n"
        "When providing code, always format it inside a markdown code block "
        "using triple backticks and specify the correct language. "
    )

@app.post("/generate")
async def generate_code(request: CodeRequest): # To Make the Network Communications b/w servers smoother using async 
    # Always add the formatting instruction
    model_prompt = format_prompt_with_backticks(request.prompt)
    inputs = tokenizer(model_prompt, return_tensors="pt").to(DEVICE) # Returns in the form of Dictionary like {"id": ...}
    
    outputs = model.generate(
        **inputs, # Gives the unpacked dictionary like id = [..], ..., etc.
        max_length = request.max_tokens,
        pad_token_id = model.config.eos_token_id  # Prevents early stopping and only stops when max_tokens are done or it encounters <EOS>
    )

    response = tokenizer.decode(outputs[0], skip_special_tokens = True) # Special Tokens like <EOS> are removed
    response = response[len(model_prompt):].strip()
    return {"response": response}

@app.post("/generate-large")
async def generate_large_code(request: CodeRequest):

    max_tokens = min(request.max_tokens, 4096)
    model_prompt = format_prompt_with_backticks(request.prompt)
    inputs = tokenizer(model_prompt, return_tensors="pt").to(DEVICE)

    outputs = model.generate(
        **inputs,
        max_length=max_tokens,
        pad_token_id=model.config.eos_token_id
    )
    full_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
    response = full_output[len(model_prompt):].strip()
    
    return {"response": response}

@app.post("/explain")
async def explain_code(request: CodeRequest):
    explain_prompt = (
        "Explain the following code in detail, including what it does, how it works, and any important concepts:\n\n"
        f"{request.prompt}\n\n"
        "Explanation:"
    )
    max_tokens = min(request.max_tokens, 2048)  # or whatever your model supports
    inputs = tokenizer(explain_prompt, return_tensors="pt").to("cuda")
    outputs = model.generate(
        **inputs,
        max_length=max_tokens,
        temperature=0.2,
        do_sample=True,
        pad_token_id=model.config.eos_token_id
    )
    full_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
    response = full_output[len(explain_prompt):].strip()
    return {"response": response}

@app.post("/improve")
async def improve_code(request: CodeRequest):
    code_to_improve = request.prompt.strip()
    improve_prompt = (
        "Improve the following code by:\n"
        "- Fixing any syntax or logical errors\n"
        "- Optimizing for better time and space efficiency\n"
        "- Removing redundant or unnecessary lines\n"
        "Return only the improved code. Do not include explanations or comments.\n\n"
        f"Code:\n{code_to_improve}\n"
        "Improved Code:"
    )
    inputs = tokenizer(improve_prompt, return_tensors="pt").to("cuda")
    outputs = model.generate(
        **inputs,
        max_length=request.max_tokens,
        temperature=0.2,
        do_sample=True,
        pad_token_id=model.config.eos_token_id,
        eos_token_id=model.config.eos_token_id
    )
    full_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Remove the prompt from the output if the model echoes it
    if full_output.startswith(improve_prompt):
        response = full_output[len(improve_prompt):].lstrip("\n\r ")
    else:
        response = full_output
    return {"response": response}

@app.post("/debug")
async def debug_code(request: CodeRequest):

    code_to_debug = request.prompt.strip()
    enhanced_prompt = (
        "You are a code review assistant. "
        "Analyze the following code and do the following:\n"
        "1. List ONLY the actual syntax or logical errors found in the code. "
        "2. Do NOT repeat the same error multiple times. "
        "3. For each error, provide a one-line description.\n"
        "4. After listing errors, provide the corrected version of the code.\n"
        "5. If the code is already correct, reply with 'No errors found.' and show the code as is.\n\n"
        f"Code:\n{code_to_debug}\n"
        "New Code Errors (if any):"
    )

    inputs = tokenizer(enhanced_prompt, return_tensors="pt").to(DEVICE)
    outputs = model.generate(
    **inputs,
    max_length = request.max_tokens  ,
    pad_token_id = model.config.eos_token_id
    )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    return {"response": response}

print(f"✅ FastAPI Server is ready to be Running on {DEVICE}!")

# Run the FastAPI server:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# We are using 2 servers since we are still developing the model and for better debugging purposes, we are using 2 ports.