import { Component } from "react";
import { Link } from "react-router-dom";
import { FaPause, FaPlay, FaSpotify } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { SlOptions } from "react-icons/sl";
import { Audio } from "react-loader-spinner";
import "./index.css";
import { GrCaretNext, GrCaretPrevious } from "react-icons/gr";
import { BiVolumeFull, BiVolumeMute } from "react-icons/bi";

class Header extends Component {
  apiStatus = {
    progress: "progress",
    success: "success",
    failure: "failure",
  };
  audioPlayerRef = null;
  intervalId = null;
  state = {
    currentTab: "foryou",
    songs: [],
    filteredSongs: [],
    currentStatus: this.apiStatus.progress,
    searchQuery: "",
    currentSong: null,
    songPlaying: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    isSeeking: false,
    isSong: true,
  };

  componentDidMount() {
    this.fetchSongs();
  }

  inputChanged = (event) => {
    const searchQuery = event.target.value.toLowerCase();
    this.setState({ searchQuery }, this.filterSongs);
  };

  pausePlay = () => {
    if (this.audioPlayerRef) {
      if (this.state.songPlaying) {
        this.audioPlayerRef.pause();
      } else {
        this.audioPlayerRef.play();
      }
      this.setState((prevState) => ({
        songPlaying: !prevState.songPlaying,
      }));
    } else {
      console.error("Audio player reference is null");
    }
  };

  filterSongs = () => {
    const { songs, searchQuery } = this.state;
    const filteredSongs = songs.filter(
      (song) =>
        song.name.toLowerCase().includes(searchQuery) ||
        song.artist.toLowerCase().includes(searchQuery)
    );
    this.setState({ filteredSongs });
  };

  fetchDuration = (url) => {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          const audio = document.createElement("audio");
          audio.src = objectUrl;
          audio.addEventListener("loadedmetadata", () => {
            resolve(audio.duration);
            URL.revokeObjectURL(objectUrl);
          });
          audio.onerror = (err) => {
            reject(err);
          };
        })
        .catch((err) => reject(err));
    });
  };

  calculateDr = (duration) => {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs < 10 ? `0${secs}` : secs}`;
  };

  setCurrentSong = (id) => {
    const { songs } = this.state;
    const song = songs.find((son) => son.id === id);
    this.setState({ currentSong: song, songPlaying: true }, () =>
      this.audioPlayerRef.play()
    );
  };

  fetchSongs = async () => {
    try {
      const response = await fetch("https://cms.samespace.com/items/songs");
      if (response.ok) {
        const data = await response.json();
        const songsWithDuration = await Promise.all(
          data["data"].map(async (song, index) => {
            try {
              const duration = await this.fetchDuration(song.url);
              const formattedDuration = this.calculateDr(duration);
              return { ...song, duration: formattedDuration, id: index + 1 };
            } catch (error) {
              return { ...song, duration: "Unknown", id: index + 1 };
            }
          })
        );
        this.setState({
          songs: songsWithDuration,
          filteredSongs: songsWithDuration,
          currentStatus: this.apiStatus.success,
          currentSong: songsWithDuration[0] || null,
        });
      } else {
        this.setState({ currentStatus: this.apiStatus.failure });
      }
    } catch (error) {
      this.setState({ currentStatus: this.apiStatus.failure });
    }
  };

  statusOfApi = () => {
    const { currentStatus, filteredSongs, currentTab } = this.state;
    switch (currentStatus) {
      case this.apiStatus.progress:
        return (
          <div className="loader-container">
            <Audio
              height="50"
              width="80"
              color="#4fa94d"
              ariaLabel="audio-loading"
              visible={true}
            />
          </div>
        );
      case this.apiStatus.success:
        return (
          <div className="success-container">
            {currentTab === "foryou" ? (
              <input
                className="search-input-element"
                type="search"
                placeholder="Search by song or artist"
                onChange={this.inputChanged}
              />
            ) : (
              <></>
            )}
            <div className="songs-list">
              {filteredSongs.length > 0 ? (
                filteredSongs.map((song) => (
                  <button
                    type="button"
                    className="each-song-overall-container"
                    key={song.id}
                    onClick={() => this.setCurrentSong(song.id)}
                  >
                    <div className="each-song">
                      <img
                        className="songs-list-cover"
                        alt={`song${song.id}`}
                        src={`https://cms.samespace.com/assets/${song.cover}`}
                      />
                      <div className="song-details">
                        <p style={{ fontWeight: "bolder" }}>{song.name}</p>
                        <p>{song.artist}</p>
                      </div>
                    </div>
                    <p>{song.duration}</p>
                  </button>
                ))
              ) : (
                <div>No songs found</div>
              )}
            </div>
          </div>
        );
      case this.apiStatus.failure:
        return <div>Failed to load data.</div>;
      default:
        return null;
    }
  };

  changePreviousSong = () => {
    const { currentSong, filteredSongs } = this.state;
    const firstId = filteredSongs[0].id;

    if (currentSong.id !== firstId) {
      const targetSong = currentSong.id - 1;
      const newSong = filteredSongs.find((song) => song.id === targetSong);
      this.setState(
        { currentSong: newSong, songPlaying: true },
        () => this.audioPlayerRef.play() // Automatically play the new song
      );
    }
  };

  changeNextSong = () => {
    const { currentSong, filteredSongs } = this.state;
    const lastId = filteredSongs[filteredSongs.length - 1].id;

    if (currentSong.id !== lastId) {
      const targetSong = currentSong.id + 1;
      const newSong = filteredSongs.find((song) => song.id === targetSong);
      this.setState({ currentSong: newSong, songPlaying: true }, () =>
        this.audioPlayerRef.play()
      );
    }
  };

  handleVolumeChange = (event) => {
    const volume = parseFloat(event.target.value);
    this.setState({ volume }, () => {
      if (this.audioPlayerRef) {
        this.audioPlayerRef.volume = this.state.volume;
      }
    });
  };

  songApiStatus = () => {
    const { currentSong, songPlaying, volume } = this.state;
    return currentSong ? (
      <>
        <h1>{currentSong.name}</h1>
        <p>{currentSong.artist}</p>
        <img
          alt={`${currentSong.id}`}
          className="current-song-image"
          src={`https://cms.samespace.com/assets/${currentSong.cover}`}
        />

        <audio
          ref={(ref) => (this.audioPlayerRef = ref)}
          src={currentSong ? currentSong.url : ""}
          volume={volume}
          hidden
        />

        <div className="all-music-controls">
          <button className="control-button-element">
            <SlOptions className="control-icon-styles" />
          </button>
          <div className="controls">
            <button
              className="control-button-element"
              onClick={() => this.changePreviousSong()}
            >
              <GrCaretPrevious className="control-icon-styles margin-class" />
            </button>
            {songPlaying ? (
              <button
                onClick={() => this.pausePlay()}
                className="control-button-element"
              >
                <FaPause className="control-icon-styles margin-class" />
              </button>
            ) : (
              <button
                onClick={() => this.pausePlay()}
                className="control-button-element"
              >
                <FaPlay className="control-icon-styles margin-class" />
              </button>
            )}
            <button
              onClick={() => this.changeNextSong()}
              className="control-button-element"
            >
              <GrCaretNext className="control-icon-styles margin-class" />
            </button>
          </div>
          <div className="volume-control">
            <button
              className="control-button-element"
              onClick={() =>
                this.setState((prevState) => ({
                  volume: prevState.volume === 1 ? 0 : 1,
                }))
              }
            >
              {volume === 0 ? (
                <BiVolumeMute className="control-icon-styles" />
              ) : (
                <BiVolumeFull className="control-icon-styles" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={this.handleVolumeChange}
              className="volume-slider"
            />
          </div>
        </div>
      </>
    ) : (
      <div className="loader-container">
        <Audio
          height="50"
          width="80"
          color="#4fa94d"
          ariaLabel="audio-loading"
          visible={true}
        />
      </div>
    );
  };

  toggleMobileView = () => {
    const { isSong } = this.state;
    this.setState({ isSong: !isSong });
  };

  setTab = async (value) => {
    await this.setState({ currentTab: value });
    const { currentTab, songs } = this.state;
    if (currentTab === "toptracks") {
      const newList = songs.filter((song) => song.top_track === true);
      this.setState({ filteredSongs: newList });
    } else {
      this.setState({ filteredSongs: songs });
    }
  };

  generateMobileView = () => {
    const { currentTab, isSong } = this.state;
    const activeForYou = currentTab === "foryou" ? "active-style" : "";
    const activeTopTracks = currentTab === "toptracks" ? "active-style" : "";
    return isSong ? (
      <div className="songs-list-container-2">
        <button
          className={`link-button ${activeForYou}`}
          onClick={() => this.setTab("foryou")}
        >
          <Link className="link-elements">For You</Link>
        </button>
        <button
          className={`link-button ${activeTopTracks}`}
          onClick={() => this.setTab("toptracks")}
        >
          <Link className="link-elements">Top Tracks</Link>
        </button>
        {this.statusOfApi()}
      </div>
    ) : (
      <div className="current-song-container-2">{this.songApiStatus()}</div>
    );
  };

  render() {
    const { currentTab, currentSong } = this.state;
    const activeForYou = currentTab === "foryou" ? "active-style" : "";
    const activeTopTracks = currentTab === "toptracks" ? "active-style" : "";
    const backgroundcolor = currentSong ? `${currentSong["accent"]}` : "black";

    return (
      <div
        className="overall-main-container"
        style={{ backgroundColor: `${backgroundcolor}` }}
      >
        <nav className="navbar-container">
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <FaSpotify
              style={{ height: "50px", width: "auto", color: "green" }}
            />
            <h1>Spotify</h1>
          </div>
          <CgProfile
            style={{ height: "50px", width: "auto", color: "white" }}
          />
        </nav>
        <div className="toggle-button-container">
          <button
            className="button-toggle"
            onClick={() => this.toggleMobileView()}
          >
            Show List/Show Song
          </button>{" "}
        </div>
        <div className="songs-list-container-1">
          <button
            className={`link-button ${activeForYou}`}
            onClick={() => this.setTab("foryou")}
          >
            <Link className="link-elements">For You</Link>
          </button>
          <button
            className={`link-button ${activeTopTracks}`}
            onClick={() => this.setTab("toptracks")}
          >
            <Link className="link-elements">Top Tracks</Link>
          </button>
          {this.statusOfApi()}
        </div>
        <div className="current-song-container-1">{this.songApiStatus()}</div>
        {this.generateMobileView()}
      </div>
    );
  }
}

export default Header;
