# Lamatic Crawler App

## Description

Lamatic Crawler App is a Next.js application designed to crawl a sitemap and index its pages. It features a chatbot that allows users to ask questions based on the crawled data. It performs Retrieval-Augmented Generation (RAG) to answer user questions based on the indexed data. This application leverages OpenAI's API and Weaviate for data indexing and retrieval.
# Prerequisites

	- Node.js and npm
	- Python 3.12 or later
	- Weaviate API Key
	- OpenAI API Key
    - Google GEMINI API (FREE)
## Features

    - Sitemap URL crawling and indexing.
    - Interactive chatbot for querying the indexed data.
    - Integration with OpenAI API for natural language processing.
    - Integration with Google Gemini for natural language processing.
    - Easy setup and configuration with environment variables.

## Installation

To get started with the Lamatic Crawler App, follow these steps:

1. **Clone the repository:**

    ```sh
    git clone https://github.com/Swag19602/lamatic-crawler-app
    cd lamatic-crawler-app
    ```

2. **Install dependencies:**

    ```sh
    npm install
    ```

3. **Create and configure the environment file:**

    Create a `.env.local` file in the root directory and add the following environment variables:

    ```plaintext
    SUPABASE_KEY=your_supabase_key
    WEAVECLIENT_HOST=your_weaveclient_host
    WEAVECLIENT_KEY=your_weaveclient_key
    SUPABASE_URL=your_supabase_url
    OPENAI_API_KEY=your_openapi_key
    ```
## Frontend (Gradio App)
1.	**Create a virtual environment and install dependencies:**
    ```sh
        cd gradio
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    ```
3. **Create and configure the environment file:**

    Create a `.env.local` file in the root directory and add the following environment variables:

    ```plaintext
    WEAVECLIENT_HOST=your_weaveclient_host
    WEAVECLIENT_KEY=your_weaveclient_key
    OPENAI_API_KEY=your_openapi_key
    GEMINI_API_KEY=your_gemini_key
    ```
5.	**Run the Gradio app:**
    ```sh
        python app.py
    ```
## Usage

1. **Run the development server:**

    ```sh
    npm run dev
    ```

2. **Open the application:**

    Visit `http://localhost:3000` in your web browser.

3. **Crawl a sitemap:**

    Enter the sitemap URL into the application to begin crawling and indexing the pages.

4. **Use the chatbot:**

    You will be navigated to  to chatbot interface once crawling and indexing is successfull, you can  use the chatbot to ask questions based on the indexed data.

## Notes

	- Ensure the URLs in your crawledData.json are accessible and contain meaningful content for better query results.
	- Adjust the Gradio app and indexing script as needed to fit your specific requirements and environment.

## Configuration

- **Environment Variables:**
    - `GEMINI_API_KEY`: Your Google GEMINI API key for natural language processing. (FREE)
    - `OPENAI_API_KEY`: Your OpenAI API key for natural language processing.
    - `WEAVIATE_HOST`: Host address for the Weaviate instance used for data indexin- `
	- `WEAVECLIENT_KEY`: API key for accessing Weaviate.
	- `SUPABASE_KEY`: API key for accessing Supabase.
	- `SUPABASE_URL`: URL for the Supabase instance.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a Pull Request.


## Contact Information

For questions or suggestions, please contact:

- **Name:** Swagatam Bhattacharjee
- **GitHub:** https://github.com/Swag19602/
- **LinkedIn:** https://www.linkedin.com/in/swagatam-bhattacharjee-5aa00a1b2/
- **Portfolio:** https://swag-portfolio.vercel.app/
- **EmailId:** swagatambhattacharjee02@gmail.com
- 

## Demo

A demo video of the Lamatic Crawler App can be found : https://www.loom.com/share/0056c702d9474f5c8fa577ed72c407ad?sid=c851e3fc-0945-4c4c-970f-626d2c6165bc

---