# Research Paper Notes: DeepSeek-Coder Series

## 🚀 Overview

AI is transforming software development, but closed-source dominance limits open research. **DeepSeek-Coder** addresses this by providing **open-source, high-performance LLMs for code**, advancing transparency, innovation, and accessibility in AI coding tools.

---

## 📚 DeepSeek-Coder Series

- A suite of **open-source code-focused LLMs** ranging from **1.3B to 33B** parameters.
- Trained from scratch on **2 trillion tokens**.
- Supports **87 programming languages** (expanded to **338 in V2**).
- Designed for **code generation**, **bug detection**, and other developer tasks.

---

## ✨ Key Features

- **Fill-In-the-Middle (FIM)** strategies:
  - *Prefix-Suffix-Middle (PSM)* and *Suffix-Prefix-Middle (SPM)*.
- **Cross-file repository-level context** awareness.
- **Tokenizer**: Hugging Face BPE, vocab size: 32,000.
- **Architecture**: Decoder-only Transformer with:
  - Rotary Positional Embedding (RoPE)
  - Grouped Query Attention (GQA)
  - FlashAttention v2
- **Training hardware**: NVIDIA A100 & H800 GPUs.

---

## 📦 Training Dataset (v1)

- **798 GB** of data, **603M files**.
- **Composition**:
  - 85% code
  - 10% code-related English
  - 5% metadata/comments
- **Sources**: GitHub and StackExchange.
- **Data cleaning techniques**:
  - Rule-based filtering (line length, character ratios)
  - Dependency parsing
  - Repository-level deduplication
  - Syntax checking via compilers

### Top Languages
- Java: 148 GB (~18%)
- Python: 120 GB (~15%)
- C++: 90 GB (~11%)

---

## 🧑‍🏫 DeepSeek-Coder-Instruct

- Instruction-tuned variant for multi-turn dialogue and code improvement tasks.
- Example:
  - **Base**: Generates a Snake game.
  - **Instruct**: Adds scoring and UI enhancements.

---

## 🧪 DeepSeek-Coder v1.5

- Further trained with **2 trillion additional tokens**.
- Improved performance in:
  - Natural language understanding
  - Mathematical reasoning
  - Programming benchmarks

---

## 🧬 DeepSeek-Coder V2

🔗 [GitHub: DeepSeek-Coder-V2](https://github.com/deepseek-ai/DeepSeek-Coder-V2)

- Built from **DeepSeek-V2** intermediate checkpoint.
- Trained with **additional 6T tokens** (total: **10.2T** tokens).
  - 4.2T from DeepSeek-V2
  - 6T from DeepSeek-Coder-V2 corpus
- **Corpus composition**:
  - 60% source code
  - 30% natural language
  - 10% math corpus
- Programming language support: **expanded from 86 to 338**
- **Context length** increased: **16K → 128K tokens** (via *Yarn* scaling)
- Architecture aligned with **DeepSeek-V2**

### ⚙️ Model Details

| Model                     | Params | Active Params | Objective              |
|--------------------------|--------|----------------|-------------------------|
| DeepSeek-Coder-V2 16B    | 16B    | 2.4B           | Next-token + FIM        |
| DeepSeek-Coder-V2 236B   | 236B   | 21B            | Next-token only         |

- Uses **DeepSeek-MoE** (Mixture of Experts) framework.
- BPE tokenizer improves multilingual token recall (e.g., Chinese).
- **Optimizer**: AdamW
- Returned from **exponential normalization** to **conventional normalization** due to training instability.
- **Reinforcement Learning**:
  - Uses **Group Relative Policy Optimization (GRPO)** for alignment.
- **Fine-tuning**: Supervised fine-tuning + RLHF + FIM (for 16B model).

### 🧪 Ablation Studies (1B model)

| Benchmark   | Accuracy (Before) | Accuracy (After) | Gain   |
|-------------|-------------------|------------------|--------|
| HumanEval   | 30.5%             | 37.2%            | +6.7%  |
| MBPP        | 44.6%             | 54.0%            | +9.4%  |

---

## ⚖️ Comparison & Limitations

- **Performance Gap**: Still behind closed-source SOTA models like **GPT-4 Turbo**, **Claude 3 Opus**, and **Gemini 1.5 Pro**.
- **Efforts to Bridge the Gap**:
  - Larger training corpora
  - Expanded context and language support
  - Improved RL alignment
  - MoE-based parameter efficiency

---

## 🏁 Conclusion

DeepSeek-Coder series represents a major advancement in **open-source AI for software engineering**. With v2’s extended training, larger context windows, MoE models, and enhanced alignment, it pushes the boundaries of what's possible with open LLMs for coding—while promoting reproducibility, scalability, and accessibility.