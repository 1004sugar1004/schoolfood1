const API_KEY = '6b6b6865467c41968d4bb4a9bea4bb76';
const BASE_URL = 'https://open.neis.go.kr/hub/mealServiceDietInfo';

// JSONP 콜백 함수들을 전역으로 관리
let callbackCounter = 0;

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date-input');
    const menuList = document.getElementById('menu-list');
    const loading = document.getElementById('loading');
    const todayMenu = document.getElementById('today-menu');

    function renderMenus(menus) {
        menuList.innerHTML = '';
        
        if (!menus || menus.length === 0) {
            menuList.innerHTML = '<li class="menu-item error">해당 날짜의 급식 정보가 없습니다.</li>';
            todayMenu.innerHTML = '<div class="menu-item error">해당 날짜의 급식 정보가 없습니다.</div>';
            return;
        }

        menus.forEach(menu => {
            const li = document.createElement('li');
            li.className = 'menu-item';
            
            // API 응답 필드명 확인 (대소문자 구분)
            const dishName = menu.DDISH_NM || menu.ddishNm || '';
            const mealDate = menu.MLSV_YMD || menu.mlsvYmd || '';
            
            li.innerHTML = `
                <div class="menu-title">${dishName.replace(/<br\/?>/g, ', ').replace(/\d+\./g, '')}</div>
                <div class="menu-date">${mealDate.slice(0,4)}-${mealDate.slice(4,6)}-${mealDate.slice(6,8)}</div>
            `;
            menuList.appendChild(li);
        });

        // 오늘의 급식 표시
        const first = menus[0];
        const firstDish = first.DDISH_NM || first.ddishNm || '';
        const firstDate = first.MLSV_YMD || first.mlsvYmd || '';
        
        todayMenu.innerHTML = `
            <div class="menu-item">
                <div class="menu-title">🍽️ ${firstDate.slice(0,4)}-${firstDate.slice(4,6)}-${firstDate.slice(6,8)} 점심</div>
                <div class="menu-title">${firstDish.replace(/<br\/?>/g, ', ').replace(/\d+\./g, '')}</div>
            </div>
        `;
    }

    function fetchMenuByDateJSONP(dateStr) {
        loading.style.display = 'block';
        menuList.innerHTML = '';
        todayMenu.innerHTML = '';

        // 고유한 콜백 함수명 생성
        const callbackName = `jsonpCallback${++callbackCounter}`;
        
        // JSONP URL 구성 - MMEAL_SC_CODE=2 추가 (점심만)
        const url = `${BASE_URL}?Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=M10&SD_SCHUL_CODE=8011143&MLSV_YMD=${dateStr}&MMEAL_SC_CODE=2&KEY=${API_KEY}&callback=${callbackName}`;

        // 전역 콜백 함수 등록
        window[callbackName] = function(data) {
            try {
                console.log('API 응답:', data); // 디버깅용
                
                // API 응답 구조 확인
                let rows = [];
                if (data.mealServiceDietInfo && data.mealServiceDietInfo.length > 1) {
                    rows = data.mealServiceDietInfo[1].row || [];
                }
                
                renderMenus(rows);
            } catch (e) {
                console.error('데이터 처리 오류:', e);
                menuList.innerHTML = '<li class="menu-item error">데이터 처리 중 오류가 발생했습니다.</li>';
                todayMenu.innerHTML = '<div class="menu-item error">데이터 처리 중 오류가 발생했습니다.</div>';
            } finally {
                loading.style.display = 'none';
                // 사용된 콜백 함수와 스크립트 태그 정리
                delete window[callbackName];
                const script = document.getElementById(callbackName);
                if (script) {
                    script.remove();
                }
            }
        };

        // 스크립트 태그 생성 및 추가
        const script = document.createElement('script');
        script.id = callbackName;
        script.src = url;
        script.onerror = function() {
            loading.style.display = 'none';
            menuList.innerHTML = '<li class="menu-item error">API 호출에 실패했습니다. 네트워크를 확인해주세요.</li>';
            todayMenu.innerHTML = '<div class="menu-item error">API 호출에 실패했습니다.</div>';
            delete window[callbackName];
            script.remove();
        };
        
        document.head.appendChild(script);
    }

    // 날짜 변경 이벤트
    if (dateInput) {
        dateInput.addEventListener('change', () => {
            const dateStr = dateInput.value.replace(/-/g, '');
            if (dateStr.length === 8) {
                fetchMenuByDateJSONP(dateStr);
            }
        });

        // 페이지 로드시 오늘 날짜로 자동 조회
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        fetchMenuByDateJSONP(`${yyyy}${mm}${dd}`);
    }
});