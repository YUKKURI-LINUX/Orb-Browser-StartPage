// ====================================================
// 1. 画像のスライドショー (既存の機能)
// ====================================================
document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".fade-item");
    let index = 0;

    setInterval(() => {
        items[index].classList.remove("active");
        index = (index + 1) % items.length;
        items[index].classList.add("active");
    }, 60000); // 1分ごとに切り替え
});


// ====================================================
// 2. 検索、利用規約、設定モーダル (既存の機能)
// ====================================================
document.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.getElementById('searchBox');
    const searchButton = document.getElementById('searchButton');
    const engineSelect = document.getElementById('engineSelect');
    
    // 検索実行関数
    function performSearch() {
        const searchEngine = engineSelect.value;
        const query = searchBox.value;
        window.open(searchEngine + query, '_self');
    }

    // 検索ボックスのEnterキー検知
    searchBox.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    searchButton.addEventListener('click', performSearch);

    // ポップアップと設定モーダル関連
    const popupBackground = document.getElementById('popupBackground');
    const openPopupButton = document.getElementById('license');
    const closePopupButton = document.getElementById('closePopup');
    const settingsLink = document.getElementById("settings"); // 注: HTMLにid="settings"が不足している場合は追加してください
    const settingsModal = document.getElementById("settingsModal");
    const overlay = document.getElementById("overlay");
    const closeModal = document.getElementById("closeModal");

    // 利用規約ポップアップ
    if (openPopupButton) {
        openPopupButton.addEventListener('click', () => {
            popupBackground.style.display = 'flex';
        });
    }

    if (closePopupButton) {
        closePopupButton.addEventListener('click', () => {
            popupBackground.style.display = 'none';
        });
    }

    popupBackground.addEventListener('click', (e) => {
        if (e.target === popupBackground) {
            popupBackground.style.display = 'none';
        }
    });

    // 設定モーダル
    if (settingsLink) {
        settingsLink.addEventListener("click", (event) => {
            event.preventDefault();  // ページ遷移を無効化
            settingsModal.style.display = "block";
            overlay.style.display = "block";
        });
    }

    function closeSettingsModal() {
        settingsModal.style.display = "none";
        overlay.style.display = "none";
    }

    if (closeModal) {
        closeModal.addEventListener("click", (event) => {
            event.preventDefault();
            closeSettingsModal();
        });
    }
    if (overlay) overlay.addEventListener("click", closeSettingsModal); //
});


// ====================================================
// 3. 天気 & 位置情報設定 (Geocoding / LocalStorage)
// ====================================================
document.addEventListener("DOMContentLoaded", () => {
    const OPENWEATHER_API_KEY = "3005d16753f47bee1c8482a9f110adba";
    const IPINFO_TOKEN = "f672166df61396";

    // ① 保存された場所（キャッシュ）があるか確認
    const savedLocation = localStorage.getItem("user_selected_location");
    if (savedLocation) {
        const { lat, lon, name } = JSON.parse(savedLocation);
        getWeather(lat, lon, name);
    } else {
        getWeatherByIP();
    }

    // ② 地域設定ポップアップの開閉
    const locationPopup = document.getElementById("locationPopup");
    const openBtn = document.getElementById("open-location-popup");
    const closeBtn = document.getElementById("closeLocationPopup");

    if (openBtn) openBtn.addEventListener("click", () => locationPopup.style.display = "flex");
    if (closeBtn) closeBtn.addEventListener("click", () => locationPopup.style.display = "none");
    
    locationPopup.addEventListener("click", (e) => {
        if (e.target === locationPopup) locationPopup.style.display = "none";
    });

    // ③ 検索・リセット処理
    document.getElementById("search-btn").addEventListener("click", searchCity);
    document.getElementById("city-input").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') searchCity();
    });
    
    document.getElementById("reset-btn").addEventListener("click", () => {
        localStorage.removeItem("user_selected_location");
        locationPopup.style.display = "none";
        getWeatherByIP();
    });

    // 自動でIPから取得する関数
    async function getWeatherByIP() {
        try {
            const geoRes = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
            const geoData = await geoRes.json();
            const [lat, lon] = geoData.loc.split(',');
            const locationName = `${geoData.region || ""} ${geoData.city || ""}`.trim() || "現在地付近";
            getWeather(lat, lon, locationName);
        } catch (error) {
            console.error("IP取得失敗:", error);
        }
    }

    // Geocoding APIを使って都市名から検索する関数
    async function searchCity() {
        const input = document.getElementById("city-input");
        const cityName = input.value.trim();
        if (!cityName) return;

        try {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${OPENWEATHER_API_KEY}`;
            const res = await fetch(geoUrl);
            const data = await res.json();

            if (data.length > 0) {
                const { lat, lon, name, local_names } = data[0];
                const displayName = local_names?.ja || name;

                // キャッシュに保存
                localStorage.setItem("user_selected_location", JSON.stringify({
                    lat, lon, name: displayName
                }));

                getWeather(lat, lon, displayName);
                input.value = "";
                locationPopup.style.display = "none"; // 成功したらポップアップを閉じる
            } else {
                alert("都市が見つかりませんでした。");
            }
        } catch (error) {
            console.error("検索失敗:", error);
        }
    }

    // 天気を取得して描画する関数
    async function getWeather(lat, lon, locationName) {
        try {
            const weatherRes = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}&lang=ja`
            );
            const weatherData = await weatherRes.json();
            displayWeatherInTab(weatherData, locationName);
        } catch (error) {
            console.error("天気取得失敗:", error);
        }
    }

    // 天気情報をHTMLに埋め込む
    function displayWeatherInTab(data, locationName) {
        const weatherInfoDiv = document.getElementById("weather-info");
        if (!weatherInfoDiv) return;

        const temperature = data.main.temp;
        const weatherStateEnglish = data.weather[0].main;
        const weatherStateJapaneseWithSvg = mapWeatherToJapanese(weatherStateEnglish);

        // 天気に合わせたアドバイス
        const commentMapping = {
            "Clear": "快晴です。外出する際は日焼け対策をしましょう。",
            "Clouds": "曇りです。お天気が不安定なので、傘を持っていくと安心です。",
            "Rain": "雨が降っています。傘を忘れずに持っていきましょう。",
            "Drizzle": "霧雨が降っています。少し濡れるかもしれません。",
            "Thunderstorm": "雷雨の恐れがあります。頑丈な建物内で過ごしましょう。",
            "Snow": "雪が降っています。路面が滑りやすいので注意が必要です。",
            "Mist": "霧が出ています。視覚が悪いため運転等に注意してください。",
            "Haze": "霞（かすみ）がかかっています。"
        };
        const comment = commentMapping[weatherStateEnglish] || "お天気の変化に気をつけてお過ごしください。";

        // 背景切り替えの実行
        setWeatherBackgroundImage(weatherStateEnglish);

        weatherInfoDiv.innerHTML = `
            <div id="weather-display" style="font-size: 14px;display: flex; align-items: center; justify-content: center;">
                   <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="20px" fill="#F3F3F3" style="margin-right: 5px;">
                    <path d="M536.5-503.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5ZM480-186q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"></path>
                </svg> 
<p style="margin: 5px 0; font-weight: bold;">${locationName}</p></div>
                <div style="font-size: 1.2em; margin: 10px 0; display: flex; align-items: center; justify-content: center;">
                    ${weatherStateJapaneseWithSvg}
                </div>
                <p style="margin: 5px 0;">気温: <span style="font-size: 1.3em; font-weight: bold;">${temperature}</span>℃</p>
                <p style="margin: 5px 0; font-size: 12px; opacity: 0.8;">湿度: ${data.main.humidity}% / 風速: ${data.wind.speed}m/s</p>
                <p style="margin-top: 15px; font-style: italic; font-size: 12px; opacity: 0.9;">${comment}</p>
            </div>
        `;
    }

    // 天気に合わせて背景画像を変更する
    function setWeatherBackgroundImage(weatherState) {
        const body = document.body;
        let imageUrl = "default.jpg";

        switch (weatherState) {
            case "Clear": imageUrl = "clear.jpg"; break;
            case "Clouds": imageUrl = "cloudy.jpg"; break;
            case "Rain": case "Drizzle": case "Thunderstorm": imageUrl = "rainy.jpg"; break;
            case "Snow": imageUrl = "snowy.jpg"; break;
            default: imageUrl = "default.jpg";
        }

        body.style.backgroundImage = `url('${imageUrl}')`;
        body.style.backgroundSize = "cover";
        body.style.backgroundRepeat = "no-repeat";
        body.style.backgroundAttachment = "fixed";
        body.style.transition = "background-image 0.5s ease-in-out";
    }

    // 天気状態（英語）をSVG付き日本語に変換する
    function mapWeatherToJapanese(weatherState) {
        const svgStyle = 'style="vertical-align: middle; margin-right: 8px;"';
        const icons = {
            clear: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#F3F3F3" ${svgStyle}><path d="M440-760v-160h80v160h-80Zm266 110-55-55 112-115 56 57-113 113Zm54 210v-80h160v80H760ZM440-40v-160h80v160h-80ZM254-652 140-763l57-56 113 113-56 54Zm508 512L651-255l54-54 114 110-57 59ZM40-440v-80h160v80H40Zm157 300-56-57 112-112 29 27 29 28-114 114Zm113-170q-70-70-70-170t70-170q70-70 170-70t170 70q70 70 70 170t-70 170q-70 70-170 70t-170-70Zm283-57q47-47 47-113t-47-113q-47-47-113-47t-113 47q-47 47-47 113t47 113q47 47 113 47t113-47ZM480-480Z"/></svg>`,
            clouds: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#F3F3F3" ${svgStyle}><path d="M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q25-92 100-149t170-57q117 0 198.5 81.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H260Zm0-80h480q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-83-58.5-141.5T480-720q-83 0-141.5 58.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41Zm220-240Z"/></svg>`,
            rain: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#F3F3F3" ${svgStyle}><path d="M558-84q-15 8-30.5 2.5T504-102l-60-120q-8-15-2.5-30.5T462-276q15-8 30.5-2.5T516-258l60 120q8 15 2.5 30.5T558-84Zm240 0q-15 8-30.5 2.5T744-102l-60-120q-8-15-2.5-30.5T702-276q15-8 30.5-2.5T756-258l60 120q8 15 2.5 30.5T798-84Zm-480 0q-15 8-30.5 2.5T264-102l-60-120q-8-15-2.5-30.5T222-276q15-8 30.5-2.5T276-258l60 120q8 15 2.5 30.5T318-84Zm-18-236q-91 0-155.5-64.5T80-540q0-83 55-145t136-73q32-57 87.5-89.5T480-880q90 0 156.5 57.5T717-679q69 6 116 57t47 122q0 75-52.5 127.5T700-320H300Zm0-80h400q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-40q0-66-47-113t-113-47q-48 0-87.5 26T333-704l-10 24h-25q-57 2-97.5 42.5T160-540q0 58 41 99t99 41Zm180-200Z"/></svg>`,
            snow: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#F3F3F3" ${svgStyle}><path d="M224.5-214.5Q210-229 210-250t14.5-35.5Q239-300 260-300t35.5 14.5Q310-271 310-250t-14.5 35.5Q281-200 260-200t-35.5-14.5Zm120 120Q330-109 330-130t14.5-35.5Q359-180 380-180t35.5 14.5Q430-151 430-130t-14.5 35.5Q401-80 380-80t-35.5-14.5Zm120-120Q450-229 450-250t14.5-35.5Q479-300 500-300t35.5 14.5Q550-271 550-250t-14.5 35.5Q521-200 500-200t-35.5-14.5Zm240 0Q690-229 690-250t14.5-35.5Q719-300 740-300t35.5 14.5Q790-271 790-250t-14.5 35.5Q761-200 740-200t-35.5-14.5Zm-120 120Q570-109 570-130t14.5-35.5Q599-180 620-180t35.5 14.5Q670-151 670-130t-14.5 35.5Q641-80 620-80t-35.5-14.5ZM300-360q-91 0-155.5-64.5T80-580q0-83 55-145t136-73q32-57 87.5-89.5T480-920q90 0 156.5 57.5T717-719q69 6 116 57t47 122q0 75-52.5 127.5T700-360H300Zm0-80h400q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-40q0-66-47-113t-113-47q-48 0-87.5 26T333-744l-10 24h-25q-57 2-97.5 42.5T160-580q0 58 41 99t99 41Zm180-100Z"/></svg>`
        };

        const weatherMapping = {
            "Clear": `${icons.clear}晴れ`,
            "Clouds": `${icons.clouds}曇り`,
            "Rain": `${icons.rain}雨`,
            "Drizzle": `${icons.rain}霧雨`,
            "Thunderstorm": `${icons.rain}雷雨`,
            "Snow": `${icons.snow}雪`,
            "Mist": `${icons.clouds}霧`,
            "Haze": `${icons.clouds}霞`,
            "Fog": `${icons.clouds}深い霧`,
            "Squall": `${icons.rain}スコール`,
            "Tornado": `${icons.clouds}竜巻`
        };

        return weatherMapping[weatherState] || weatherState;
    }
});


// ====================================================
// 4. Python（Qt）との連携処理 (既存の機能)
// ====================================================
var bridge;
document.addEventListener("DOMContentLoaded", function() {
    // Python側との接続を初期化
    new QWebChannel(qt.webChannelTransport, function(channel) {
        bridge = channel.objects.bridge;

        // ① Pythonから現在のデフォルト検索エンジンを取得して反映
        // 注: 元コードの 'search-engine-selector' を HTMLのID 'engineSelect' に揃えました
        bridge.getSearchEngine(function(engine) {
            var select = document.getElementById('engineSelect');
            if (select) select.value = engine;
        });

        // ② Python側で検索エンジンが変更された場合、同期させる
        bridge.searchEngineChanged.connect(function(engine) {
            var select = document.getElementById('engineSelect');
            if (select) select.value = engine;
        });
    });
});

// ③ HTMLのセレクトボックスが変更された時にPython側に通知する関数
function onSearchEngineChange(selectElement) {
    if (bridge) {
        bridge.changeSearchEngine(selectElement.value);
    }
}

// ④ HTMLの検索フォームから直接検索を実行させたい場合に呼ぶ関数
function doSearch(query) {
    if (bridge) {
        bridge.search(query);
    }
}

function updateClock() {
    const now = new Date();
    
    // 日付のフォーマット (例: 4月6日(月))
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayList = ["日", "月", "火", "水", "木", "金", "土"];
    const day = dayList[now.getDay()];
    
    // 時間のフォーマット (例: 18:00)
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    
    const clockElement = document.getElementById('digital-clock');
    if (clockElement) {
        clockElement.innerHTML = `
            <span class="clock-date">${month}月${date}日(${day})</span>
            <span class="clock-time">${h}:${m}</span>
        `;
    }
}

// 1秒ごとに実行（秒を表示しない場合でも、分が変わる瞬間のズレを防ぐため1秒更新が理想です）
setInterval(updateClock, 1000);
updateClock();