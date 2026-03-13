# Code Generation Feature - Visual Guide

## 🎨 User Interface Overview

### Step 1: Navigate to Code Tab
When viewing any API endpoint, you'll see a new **"Code"** tab next to the Responses tab:

```
┌─────────────────────────────────────────────────────┐
│ GET /api/users/{id}/                                │
│ Get user by ID                                       │
├─────────────────────────────────────────────────────┤
│ [Parameters] [Headers] [Responses] [🔧 Code]       │
└─────────────────────────────────────────────────────┘
```

### Step 2: Language Selector
At the top of the Code tab, select your preferred language:

```
Select Language
┌──────────────────────────────────────────────────────┐
│  🐍 Python   ⚡ JavaScript   🔧 cURL   🦄 HTTPie    │
│  🐘 PHP   ☕ Java   🚀 Go                           │
└──────────────────────────────────────────────────────┘
```

**Active language** shows with blue background and white text.

### Step 3: Generated Code Display

```
┌──────────────────────────────────────────────────────┐
│ 🟢 Python                             [Copy Button]  │
├──────────────────────────────────────────────────────┤
│ import requests                                       │
│                                                       │
│ url = "http://localhost:8000/api/users/123/"        │
│                                                       │
│ headers = {                                           │
│     "Authorization": "Bearer eyJhbGci...",          │
│     "Content-Type": "application/json",             │
│ }                                                     │
│                                                       │
│ response = requests.get(url, headers=headers)        │
│                                                       │
│ print(f"Status: {response.status_code}")            │
│ print(response.json())                               │
└──────────────────────────────────────────────────────┘
```

### Step 4: Generate Button

```
┌──────────────────────────────────────────────────────┐
│         🔧 Generate Code                             │
└──────────────────────────────────────────────────────┘
```
Full-width button with gradient purple-to-blue background.

### Step 5: Info Box

```
┌──────────────────────────────────────────────────────┐
│ ℹ️  Code Generation Tips:                            │
│                                                       │
│ • Fill in parameters, headers, and body before       │
│   generating                                          │
│ • Global authentication is automatically included    │
│ • Switch languages anytime to see different          │
│   implementations                                     │
│ • Copy and paste directly into your project          │
└──────────────────────────────────────────────────────┘
```

## 📱 Responsive Design

### Desktop (≥ 1024px)
- Language buttons in horizontal row
- Code display with max-height scroll
- Full-width generate button

### Tablet (≥ 640px)
- Language buttons wrap to 2 rows
- Maintains full functionality

### Mobile (< 640px)
- Language buttons in column layout
- Scrollable code display
- Touch-friendly copy button

## 🎨 Color Scheme

### Language Buttons (Inactive)
- Background: `bg-gray-200 dark:bg-gray-700`
- Text: `text-gray-700 dark:text-gray-300`
- Hover: `hover:bg-gray-300 dark:hover:bg-gray-600`

### Language Buttons (Active)
- Background: `bg-blue-600`
- Text: `text-white`
- Shadow: `shadow-lg`

### Code Display
- Background: `bg-gray-900` (dark theme)
- Border: `border-gray-700`
- Text: `text-gray-100`
- Header Background: `bg-gray-800`

### Generate Button
- Background: `bg-gradient-to-r from-purple-600 to-blue-600`
- Hover: `from-purple-700 to-blue-700`
- Shadow: `shadow-lg hover:shadow-xl`
- Icon: Code brackets with stroke-2

### Info Box
- Background: `bg-blue-50 dark:bg-blue-900/20`
- Border: `border-blue-200 dark:border-blue-800`
- Text: `text-blue-800 dark:text-blue-300`
- Icon: Blue info circle

## 🔄 Interactive States

### Loading State
```
// Generating python code...
```
Gray text with animation (potential future enhancement)

### Error State
```
// Error generating code: Invalid JSON in request body
```
Red text, persists until user fixes issue

### Success State
- Code displayed in mono font
- "Generated successfully!" toast notification (green)
- Copy button enabled

## 🖱️ User Interactions

### Language Switch
1. User clicks different language button
2. Button becomes active (blue)
3. Previous button returns to gray
4. Label updates to show current language
5. If code exists, auto-regenerates

### Generate Code
1. User clicks "Generate Code" button
2. Loading message appears
3. POST request sent to `/generate-code/`
4. Code displayed in code block
5. Success toast appears

### Copy Code
1. User clicks "Copy" button
2. Code copied to clipboard
3. "Copied!" toast appears (green)
4. Button remains enabled for re-copying

## 📋 Code Examples by Language

### Python Example
```python
import requests

url = "http://localhost:8000/api/products/"

params = {
    "category": "electronics",
    "page": 1,
}

headers = {
    "Authorization": "Bearer token123",
}

response = requests.get(url, params=params, headers=headers)

print(f"Status: {response.status_code}")
print(response.json())
```

### JavaScript Example
```javascript
const url = "http://localhost:8000/api/products/?category=electronics&page=1";

const options = {
  method: "GET",
  headers: {
    "Authorization": "Bearer token123",
  },
};

fetch(url, options)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### cURL Example
```bash
curl -X GET "http://localhost:8000/api/products/?category=electronics&page=1" \
  -H "Authorization: Bearer token123"
```

### HTTPie Example
```bash
http GET http://localhost:8000/api/products/ category==electronics page==1 \
  "Authorization:Bearer token123"
```

### PHP Example
```php
<?php

$url = "http://localhost:8000/api/products/?category=electronics&page=1";

$ch = curl_init($url);

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer token123",
]);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

echo "Status: $statusCode\n";
echo $response;
?>
```

### Java Example
```java
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.*;

public class ApiClient {
    public static void main(String[] args) {
        try {
            URL url = new URL("http://localhost:8000/api/products/?category=electronics&page=1");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            conn.setRequestProperty("Authorization", "Bearer token123");

            int statusCode = conn.getResponseCode();
            BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), "utf-8"));
            StringBuilder response = new StringBuilder();
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }

            System.out.println("Status: " + statusCode);
            System.out.println(response.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Go Example
```go
package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    url := "http://localhost:8000/api/products/?category=electronics&page=1"

    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        panic(err)
    }

    req.Header.Set("Authorization", "Bearer token123")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    fmt.Println("Status:", resp.Status)
    bodyBytes, _ := io.ReadAll(resp.Body)
    fmt.Println(string(bodyBytes))
}
```

## 🎯 Design Principles

### 1. **Clarity**
- Clear language labels with emoji icons
- Obvious generate and copy buttons
- Helpful info box with tips

### 2. **Consistency**
- Matches overall portal dark theme
- Uses same button styles as rest of app
- Consistent spacing and borders

### 3. **Efficiency**
- One-click generation
- One-click copy
- Language switching without regenerating

### 4. **Accessibility**
- High contrast text
- Large clickable areas
- Keyboard navigation support (future)

### 5. **Responsiveness**
- Works on all screen sizes
- Touch-friendly on mobile
- Maintains functionality on small screens

---

**Pro Tip**: Set up global authentication first using the "Authorize" button in the sidebar for the best experience!
