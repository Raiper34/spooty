# Folder Structure Choice Feature - Complete Guide

## 🎯 Feature Overview

Users can now choose between **two folder organization structures** when downloading music from Spotify:

### 1. Playlist Structure (Default)
Organizes music by the playlist/source:
```
downloads/
└── username/
    └── Playlist Name/
        └── Artist - Song.mp3
```

**Best for:**
- Keeping playlist context
- Downloading specific curated playlists
- Quick downloads that stay together
- Default behavior

### 2. Artist/Album Structure (Optional)
Organizes music like a professional music library:
```
downloads/
└── username/
    └── Artist Name/
        └── Album Name/
            └── Artist - Song.mp3
```

**Best for:**
- Building a music library
- Users who download from multiple playlists
- Avoiding duplicate songs across playlists
- Professional music organization


## 🎨 User Interface

### Location
The checkbox appears in the **Download** section, right below the URL input field.

### Checkbox Label
```
☑ Use playlist-based folder structure (uncheck to organize by Artist/Album)
```

### Behavior
- **Checked (default)**: Uses Playlist structure
- **Unchecked**: Uses Artist/Album structure
- **Persistent**: Each playlist remembers its chosen structure
- **Per-download**: You can mix both structures in your library
- **⚠️ Important**: Single track downloads ALWAYS use Artist/Album structure (checkbox is ignored)

## 📝 Usage Examples

### Example 0: Single Track Download (Always Artist/Album)

**Action:** Paste a single track URL (checkbox setting doesn't matter)

**Downloads:**
```
downloads/
└── username/
    └── Artist Name/
        └── Album Name/
            └── Artist - Song.mp3
```

**Note:** Single tracks always organize by Artist/Album regardless of checkbox!

### Example 1: Keeping Playlists Separate (Playlist Structure - Default)

**Action:** Leave checkbox checked (default), paste playlist URL "Workout Mix"

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
- Default behavior

### Example 2: Building a Music Library (Artist/Album Structure)

**Action:** Uncheck the checkbox, paste playlist URL

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


### Example 3: Mixed Approach

You can use both! Some playlists with Playlist structure, others with Artist/Album:

```
downloads/
└── username/
    ├── Workout Mix/             # From "Workout Mix" (checked - default)
    │   ├── AC-DC - Thunderstruck.mp3
    │   └── Queen - We Will Rock You.mp3
    ├── Pink Floyd/              # From "Classic Rock" (unchecked)
    │   └── The Dark Side of the Moon/
    │       └── Pink Floyd - Time.mp3
    └── Led Zeppelin/            # From "Classic Rock" (unchecked)
        └── Led Zeppelin IV/
            └── Led Zeppelin - Stairway to Heaven.mp3
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
- **ALWAYS uses Artist/Album structure**: `downloads/username/Artist/Album/Song.mp3`
- **The checkbox setting is ignored** for single track downloads
- This ensures proper organization of individual songs

## 🎛️ Default Settings

### Why Playlist Structure is Default?
1. **Simpler organization** - keeps downloads together by source
2. **Playlist context preserved** - easy to find songs from specific lists
3. **Quick and straightforward** - minimal folder nesting
4. **Familiar behavior** - matches typical download expectations

### Changing Per-Download
Simply check/uncheck the box before each download. Each playlist will remember its setting.

## 🚀 Getting Started

1. **Start the application** (backend + frontend)
2. **Navigate to the download section**
3. **Paste a Spotify URL**
4. **Choose your structure:**
   - Leave checked (default) for Playlist structure
   - Uncheck for Artist/Album structure
5. **Click Download**

## 📊 Quick Comparison

| Feature | Playlist Structure (Default) | Artist/Album Structure |
|---------|----------------------|-------------------|
| Organization | By Playlist Name | By Artist → Album |
| Duplicates | Possible | Avoided |
| Best For | Playlist Context | Music Library |
| Folder Depth | 2 levels | 3 levels |
| Quick Access | By Playlist | By Artist |
| Default | ✅ Yes | ❌ No |

## 💡 Pro Tips

1. **For specific playlists**: Leave checked (default) to keep them separate
2. **For large collections**: Uncheck the box to use Artist/Album organization
3. **Mix and match**: Different playlists can use different structures
4. **Re-downloading**: Delete and re-add to change structure
5. **Unknown Album**: If album data is missing, tracks go to "Unknown Album" folder

## 🔄 Migration from Old Version

If you're upgrading from the old version:

1. **Existing playlists** will default to Playlist structure (checked)
2. **To organize by Artist/Album**: Uncheck the box when re-downloading
3. **Database auto-updates**: No manual migration needed
4. **Backward compatible**: Old downloads won't be affected

## ❓ FAQ

**Q: What about single track downloads?**  
A: Single tracks ALWAYS use Artist/Album structure (`username/Artist/Album/Song.mp3`), regardless of the checkbox setting. This ensures proper organization.

**Q: Can I change the structure after downloading?**  
A: Delete the playlist and re-download with the desired setting.

**Q: What happens if I download the same song from two playlists?**  
- **Playlist (default)**: Two separate copies in different playlist folders
- **Artist/Album**: Same file location (may overwrite)

**Q: What if album information is missing?**  
A: Songs go to "Unknown Album" folder under the artist (when using Artist/Album mode).

**Q: Can I set a global default?**  
A: Currently, it's per-download, but defaults to Playlist structure (checked). Single tracks always use Artist/Album.

---

**Enjoy your perfectly organized music library! 🎵**

