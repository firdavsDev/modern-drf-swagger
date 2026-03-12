# Images Directory

This directory contains screenshots and images used in the documentation.

## Required Screenshots

Please add the following screenshots to this directory:

### 1. `login.png`
Screenshot of the login page showing:
- Login form with username and password fields
- Password show/hide eye icon
- Dark theme toggle button
- "API Portal" branding

**Recommended size**: 1920x1080 or 1280x720

---

### 2. `api.png`
Screenshot of the main API Explorer interface showing:
- Endpoint list on the left (with collapsible groups)
- Request editor in the center (parameters, headers, body)
- Response viewer on the right (JSON with syntax highlighting)
- Send request button
- Example of a successful API call

**Recommended size**: 1920x1080 (full interface)

---

### 3. `analy.png`
Screenshot of the Analytics Dashboard showing:
- Total requests and error rate metrics
- Average latency display
- Top endpoints chart
- Daily request timeline (Chart.js graph)
- Date range selector (7/30/90 days)

**Recommended size**: 1920x1080 or 1280x720

---

## How to Take Screenshots

1. **Start the development server**:
   ```bash
   cd sample_project
   python manage.py runserver
   ```

2. **Access the pages**:
   - Login: `http://localhost:8000/portal/`
   - API Explorer: `http://localhost:8000/portal/` (after login)
   - Analytics: `http://localhost:8000/portal/analytics/`

3. **Take screenshots**:
   - Use your OS screenshot tool (Cmd+Shift+3 on Mac, PrtScn on Windows)
   - Or use browser DevTools device toolbar for consistent sizing
   - Ensure dark theme is enabled for consistency

4. **Save files**:
   - Save as PNG format
   - Name exactly as: `login.png`, `api.png`, `analy.png`
   - Place in this `images/` directory

5. **Optimize images** (optional):
   - Use tools like TinyPNG or ImageOptim to reduce file size
   - Target < 500KB per image

---

## Alternative: Use Placeholder Images

If you don't have screenshots yet, you can use placeholder images temporarily:

```bash
# Create placeholder images (requires ImageMagick)
convert -size 1280x720 xc:gray -pointsize 48 -draw "text 400,360 'Login Page Coming Soon'" login.png
convert -size 1920x1080 xc:gray -pointsize 48 -draw "text 600,540 'API Explorer Coming Soon'" api.png
convert -size 1920x1080 xc:gray -pointsize 48 -draw "text 600,540 'Analytics Coming Soon'" analy.png
```

---

**Note**: These images will be displayed in README.md and should look professional and clear.
