# 🚀 QUICK START: Free AI Video Generation

The app now automatically tries **3 FREE/CHEAP video generation services**.

## ⚡ FASTEST SETUP (5 minutes)

### **✨ OPTION 1: HUGGING FACE (Completely FREE)**

1. Go to https://huggingface.co and sign up (free)
2. Done! No API key needed for basic usage
3. App will auto-use free inference API

**That's it!** The app will now generate videos for FREE.

---

### **💰 OPTION 2: REPLICATE (Super Cheap)**

If you want faster, better quality videos:

1. Go to https://replicate.com
2. Sign up (free account, no credit card for free tier)
3. Copy your API token from: https://replicate.com/account/api-tokens
4. Set environment variable:

**Windows PowerShell:**
```powershell
$env:REPLICATE_API_TOKEN = "your-token-here"
```

**Or just add to `d:\ai3d\backend\.env`:**
```
REPLICATE_API_TOKEN=your-token-here
```

5. Done! App will use Replicate ($0.003/video after free tier)

---

## 🎬 TEST IT NOW

1. **Restart backend:**
   ```bash
   # It will auto-reload, or restart PowerShell terminal running backend
   ```

2. **Go to app:** http://localhost:5173

3. **Generate video:**
   - Open "Videos" tab
   - Click "Generate Video"
   - Wait 1-2 minutes
   - Video generated! ✓

4. **Watch progress:**
   - 🎨 Generating frame images...
   - 🎬 Generating video...
   - ✓ Complete!

---

## 📊 Provider Fallback Chain

```
Try #1: Veo 3.1 (Google) - May not be available
   ↓ Fails?
Try #2: Replicate - $0.003/video (if API key set)
   ↓ Fails?
Try #3: Hugging Face - FREE (always available)
   ↓ Fails?
Show template descriptions
```

---

## ✅ Quick Check

### Check if Hugging Face works (FREE):
```bash
python -c "from huggingface_hub import InferenceClient; print('✓ HF OK')"
```

### Check if Replicate works:
```bash
python -c "import replicate; print('✓ Replicate OK')"
```

---

## 💡 Pro Tips

**Want completely free?** → Use Hugging Face (no setup needed!)

**Want better quality?** → Set up Replicate (super cheap)

**Want both?** → Set up both, app tries Replicate first, falls back to HF

**Running out of Replicate free tier?** → Hugging Face still works for free!

---

## 🆘 If Video Generation Fails

1. **Check logs in backend terminal** - Look for error messages
2. **Try Hugging Face** - It's completely free, should work
3. **Set Replicate token** - If you have an account
4. **Restart backend** - Kill PowerShell terminal and restart

---

## 🎓 Example: Step-by-Step

### **I'm going to use Hugging Face (FREE):**

1. ✓ Already installed
2. ✓ Already set up
3. Go to app: http://localhost:5173
4. Videos → STEMI → Generate Video
5. Wait 1-2 minutes
6. Video appears!

### **I'm going to use Replicate (CHEAP):**

1. Visit https://replicate.com → Sign up
2. Get token from https://replicate.com/account/api-tokens
3. In PowerShell:
   ```powershell
   $env:REPLICATE_API_TOKEN = "your-token"
   ```
4. Go to app: http://localhost:5173
5. Videos → STEMI → Generate Video
6. Wait and watch progress
7. Video appears!

---

## 📞 Need Help?

See detailed setup guide: [ALTERNATIVE_VIDEO_PROVIDERS.md](ALTERNATIVE_VIDEO_PROVIDERS.md)

Error? Check backend logs in the PowerShell terminal running the server.

**ALL SYSTEMS GO!** 🚀 Try generating a video now!
