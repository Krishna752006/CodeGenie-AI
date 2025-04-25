from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer # DL Library Developed by Hugging Face

Model_Name = "deepseek-ai/deepseek-coder-1.3b-instruct"  # Model Used
Model_location = "./deepseek_model" # Model Location

# Remove comments if you have a gpu and change to cuda
tokenizer = AutoTokenizer.from_pretrained(Model_Name, cache_dir = Model_location) # Downloads and loads the tokenizer, not the whole model.
model = AutoModelForCausalLM.from_pretrained( # Downloads and loads the whole model.
    Model_Name,
    # torch_dtype = torch.float16, # Makes the usual values from float32 to float16, reducing the data thus making it faster for processing. But Works well only on GPUs.
    device_map = "cpu", # Runs the Model Entirely on CPU
    offload_folder = "./offload", # Loads the Model into ROM if RAM being used is completely filled. Only used for better the loading.
    cache_dir = Model_location
).eval() # Disables training-specific behaviors like Droupout, etc.. and puts in evaluating mode.

app = FastAPI()

# Add the CORS middleware to handle cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all domains to make requests to this API
    allow_credentials=True, # Allow credentials such as cookies and authorization headers to be included in requests
    allow_methods=["*"],  # Allow all HTTP methods: GET, POST, PUT, DELETE, etc.
    allow_headers=["*"], # Allow all headers in the requests (e.g., content-type, authorization)
    expose_headers=["*"] # Expose all response headers to the client (this is useful for debugging)
)

class CodeRequest(BaseModel):
    prompt: str
    max_tokens: int = 1000  # Increased max tokens

@app.post("/generate")
async def generate_code(request: CodeRequest):
    inputs = tokenizer(request.prompt, return_tensors="pt").to("cpu") # change to cuda if you have gpu

    outputs = model.generate(
        **inputs, 
        max_length=request.max_tokens,  
        temperature=0.2,  # Lower temperature for deterministic responses
        do_sample=True,
        pad_token_id=model.config.eos_token_id  # Prevents early stopping
    )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return {"response": response}

print("✅ FastAPI Server is ready!")

# Run the FastAPI server:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload