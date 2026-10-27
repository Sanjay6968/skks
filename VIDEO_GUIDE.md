# Video Recording & Submission Step-by-Step Guide

This guide ensures you can record, publish, and submit all deliverables within 15 minutes.

---

## 1. Quick Video Recording Steps (Max 10 Minutes Total)

1. **Launch the Application**:
   ```bash
   python -m uvicorn backend.main:app --port 8000
   ```
   Open `http://localhost:8000` in your web browser (Chrome / Edge).

2. **Open Recording Tool**:
   - On Windows: Press `Win + Alt + R` (built-in Xbox Game Bar screen recorder) or use [OBS Studio](https://obsproject.com/) / [Loom](https://www.loom.com/).
   - Ensure microphone audio is enabled.

3. **Follow the Script**:
   - Open `PRESENTATION.md` side-by-side or on a second screen.
   - **Part 1 (0:00 to 4:30)**: Pitch to the client. Keep the browser open on `http://localhost:8000`. Switch between the **Day-Ahead Decision** tab and the **Accuracy & Risk Analytics** tab. Toggle gate closure times and the Forecast Waterfall.
   - **Part 2 (4:30 to 9:30)**: Tech Lead review. Switch to your code editor (VS Code / IDE) or open `backend/main.py`, `frontend/src/App.jsx`, `Dockerfile`, and run `python backend/test_app.py` in the terminal to demonstrate automated testing.
   - Total time: Under 10 minutes.

4. **Upload to YouTube as Unlisted**:
   - Go to [YouTube Studio](https://studio.youtube.com/).
   - Click **Create > Upload Videos**.
   - Set visibility to **Unlisted** (anyone with the link can view, but it does not appear publicly or in search).
   - Copy the YouTube video URL (e.g. `https://youtu.be/...`).

---

## 2. GitHub Public Repository (Anonymous Name)

1. Create a public repository on GitHub with an anonymous name as requested (e.g., `kjhwr-elexon` or a random string like `elex-wind-7492`).
2. Push your project to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial release of UK Wind Day-Ahead Procurement platform"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<anonymous-repo-name>.git
   git push -u origin main
   ```

---

## 3. Cloud Deployment (Heroku or Vercel)

### Option A: Heroku / Render
- Heroku / Render will automatically detect the `Dockerfile` or `Procfile` and `backend/requirements.txt`.
- Set port to `$PORT`.
- Deploy directly from your GitHub repo.

### Option B: Vercel
- Import repository into Vercel.
- Vercel uses `vercel.json` and builds the frontend.

---

## 4. Microsoft Form Submission (Checklist)

Form Link: [https://forms.cloud.microsoft/r/FTX6K2bbnU](https://forms.cloud.microsoft/r/FTX6K2bbnU)

Verify the following before submitting:
- [ ] **Unlisted YouTube Video Link**: Open in Incognito window to confirm video plays without login.
- [ ] **Public GitHub Repo Link**: Open in Incognito window to confirm repository is accessible.
- [ ] **Live App Deployment URL**: Open in Incognito window to confirm app loads and displays data.
