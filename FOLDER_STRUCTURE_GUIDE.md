# Folder Structure Choice Feature - Complete Guide

## 🎯 Feature Overview

Users can now choose between **two folder organization structures** when downloading music from Spotify:

### 1. Artist/Album Structure (Default - Recommended)
Organizes music like a professional music library:
```
downloads/
└── Artist Name/
    └── Album Name/
        └── Artist - Song.mp3
```

**Best for:**
- Building a music library
- Users who download from multiple playlists
- Avoiding duplicate songs across playlists
- Professional music organization

### 2. Playlist Structure (Optional - Legacy)
Organizes music by the playlist/source:
```
downloads/
└── Playlist Name/
    └── Artist - Song.mp3
```

**Best for:**
- Keeping playlist context
- Downloading specific curated playlists
- Users who prefer the old behavior
- Quick downloads that stay together

## 🎨 User Interface

### Location
The checkbox appears in the **Download** section, right below the URL input field.

### Checkbox Label
```
☐ Use playlist-based folder structure (default: organize by Artist/Album)
```

### Behavior
- **Unchecked (default)**: Uses Artist/Album structure
- **Checked**: Uses Playlist structure
- **Persistent**: Each playlist remembers its chosen structure
- **Per-download**: You can mix both structures in your library

## 📝 Usage Examples

### Example 1: Building a Music Library (Artist/Album - Default)

**Action:** Leave checkbox unchecked, paste playlist URL

**Downloads:**
```
downloads/
├── Pink Floyd/
│   ├── The Dark Side of the Moon/
│   │   ├── Pink Floyd - Time.mp3
│   │   └── Pink Floyd - Money.mp3
│   └── The Wall/
│       └── Pink Floyd - Another Brick in the Wall.mp3
├── Led Zeppelin/
│   └── Led Zeppelin IV/
│       └── Led Zeppelin - Stairway to Heaven.mp3
```

**Benefits:**
- If you download another playlist with "Time", it goes to the same folder
- Easy to browse by artist
- Professional organization

### Example 2: Keeping Playlists Separate (Playlist Structure)

**Action:** Check the checkbox, paste playlist URL "Workout Mix"

**Downloads:**
```
downloads/
└── Workout Mix/
    ├── AC-DC - Thunderstruck.mp3
    ├── Survivor - Eye of the Tiger.mp3
    └── Queen - We Will Rock You.mp3
```

**Benefits:**
- All workout songs stay together
- Preserves playlist context
- Easy to find all songs from a specific list

### Example 3: Mixed Approach

You can use both! Some playlists with Artist/Album, others with Playlist structure:

```
downloads/
├── Pink Floyd/              # From "Classic Rock" (unchecked)
│   └── The Dark Side of the Moon/
│       └── Pink Floyd - Time.mp3
├── Led Zeppelin/            # From "Classic Rock" (unchecked)
│   └── Led Zeppelin IV/
│       └── Led Zeppelin - Stairway to Heaven.mp3
└── Workout Mix/             # From "Workout Mix" (checked)
    ├── AC-DC - Thunderstruck.mp3
    └── Queen - We Will Rock You.mp3
```

## 🔧 Technical Details

### Database Fields
- **`album`**: Stores album name for each track
- **`usePlaylistStructure`**: Boolean flag per playlist (default: true)

### Smart Logic
The system automatically:
1. Checks the `usePlaylistStructure` flag for each playlist
2. Creates appropriate folder structure
3. Handles missing album data gracefully ("Unknown Album")
4. Sanitizes folder names (removes illegal characters)
5. Creates folders recursively as needed

### Individual Tracks
For individual track downloads (not from playlists):
- **Artist/Album mode**: Goes to `downloads/Artist/Album/`
- **Playlist mode**: Goes directly to `downloads/`

## 🎛️ Default Settings

### Why Artist/Album is Default?
1. **Better organization** for large libraries
2. **Prevents duplicates** across playlists
3. **Industry standard** music organization
4. **Future-proof** for library growth

### Changing Per-Download
Simply check/uncheck the box before each download. Each playlist will remember its setting.

## 🚀 Getting Started

1. **Start the application** (backend + frontend)
2. **Navigate to the download section**
3. **Paste a Spotify URL**
4. **Choose your structure:**
   - Leave unchecked for Artist/Album
   - Check for Playlist structure
5. **Click Download**

## 📊 Quick Comparison

| Feature | Artist/Album (Default) | Playlist Structure |
|---------|----------------------|-------------------|
| Organization | By Artist → Album | By Playlist Name |
| Duplicates | Avoided | Possible |
| Best For | Music Library | Playlist Context |
| Folder Depth | 3 levels | 2 levels |
| Professional | ✅ Yes | ❌ No |
| Quick Access | By Artist | By Playlist |
| Default | ✅ Yes | ❌ No |

## 💡 Pro Tips

1. **For large collections**: Use Artist/Album (default)
2. **For specific playlists**: Check the box to keep them separate
3. **Mix and match**: Different playlists can use different structures
4. **Re-downloading**: Delete and re-add to change structure
5. **Unknown Album**: If album data is missing, tracks go to "Unknown Album" folder

## 🔄 Migration from Old Version

If you're upgrading from the old version:

1. **Existing playlists** will default to Artist/Album structure
2. **To use old behavior**: Check the box when re-downloading
3. **Database auto-updates**: No manual migration needed
4. **Backward compatible**: Old downloads won't be affected

## ❓ FAQ

**Q: Can I change the structure after downloading?**  
A: Delete the playlist and re-download with the desired setting.

**Q: What happens if I download the same song from two playlists?**  
- **Artist/Album**: Same file location (may overwrite)
- **Playlist**: Two separate copies

**Q: What if album information is missing?**  
A: Songs go to "Unknown Album" folder under the artist.

**Q: Can I set a global default?**  
A: Currently, it's per-download, but defaults to Artist/Album (unchecked).

---

**Enjoy your perfectly organized music library! 🎵**

