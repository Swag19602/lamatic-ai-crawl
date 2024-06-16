FROM python:3.9

# Set the working directory
WORKDIR /app

# Copy requirements.txt to the working directory
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that the Gradio app runs on
EXPOSE 7860

# Start the Gradio application
CMD ["python", "app.py"]