// إعداد API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// دالة للتمرير السلس
function scrollToSearch() {
    document.getElementById('predictions').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// البحث عن فريق
async function searchTeam() {
    const query = document.getElementById('teamSearch').value.trim();
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query) {
        showMessage('الرجاء إدخال اسم الفريق', 'warning');
        return;
    }

    // إظهار مؤشر التحميل
    resultsDiv.innerHTML = '<div class="loading-container"><div class="loading"></div><p>جاري البحث...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/teams/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error('فشل الاتصال بالخادم');
        }

        const teams = await response.json();

        if (!teams || teams.length === 0) {
            resultsDiv.innerHTML = '<div class="message warning">لم يتم العثور على نتائج</div>';
            return;
        }

        // عرض النتائج
        resultsDiv.innerHTML = teams.map(team => `
            <div class="team-card" onclick="viewTeamDetails(${team.provider_team_id})">
                <img src="${team.logo || 'https://via.placeholder.com/80'}" 
                     alt="${team.name}" 
                     onerror="this.src='https://via.placeholder.com/80'">
                <h3>${team.name}</h3>
                <p>${team.country || 'غير محدد'}</p>
                <p class="team-founded">تأسس: ${team.founded || 'غير معروف'}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('خطأ في البحث:', error);
        resultsDiv.innerHTML = `
            <div class="message error">
                حدث خطأ أثناء البحث. تأكد من تشغيل الخادم على ${API_BASE_URL}
            </div>
        `;
    }
}

// عرض تفاصيل الفريق
function viewTeamDetails(teamId) {
    showMessage(`جاري تحميل معلومات الفريق #${teamId}...`, 'success');
    // هنا يمكن إضافة صفحة تفاصيل الفريق
}

// تصفية المباريات
function filterFixtures(filter) {
    // تحديث الأزرار
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    showMessage(`تم تصفية المباريات: ${filter}`, 'success');
    // هنا يمكن إضافة منطق التصفية الفعلي
}

// عرض التنبؤ
async function showPrediction(fixtureId) {
    const modal = document.getElementById('predictionModal');
    const content = document.getElementById('predictionContent');

    // إظهار المودال مع مؤشر التحميل
    modal.style.display = 'block';
    content.innerHTML = '<div class="loading-container"><div class="loading"></div><p>جاري تحليل المباراة...</p></div>';

    try {
        // محاكاة البيانات (في الإنتاج، استخدم API الفعلي)
        const mockPrediction = generateMockPrediction(fixtureId);
        
        // عرض التنبؤات
        content.innerHTML = `
            <!-- علامات التبويب -->
            <div class="prediction-tabs">
                <button class="tab-btn active" onclick="showTab('ensemble')">Ensemble</button>
                <button class="tab-btn" onclick="showTab('elo')">ELO</button>
                <button class="tab-btn" onclick="showTab('poisson')">Poisson</button>
            </div>

            <!-- محتوى Ensemble -->
            <div id="tab-ensemble" class="tab-content">
                <div class="prediction-result">
                    <h3>🤖 تنبؤ Ensemble (الموصى به)</h3>
                    <p style="color: var(--text-light); margin-bottom: 2rem;">
                        جمع ذكي بين خوارزميات ELO و Poisson للحصول على أدق تنبؤ
                    </p>
                    
                    <div class="prob-bars">
                        <div class="prob-bar">
                            <div class="prob-label">
                                <span>فوز الفريق الأول</span>
                                <span>${mockPrediction.ensemble.home_win}%</span>
                            </div>
                            <div class="prob-fill" style="width: ${mockPrediction.ensemble.home_win}%">
                                ${mockPrediction.ensemble.home_win}%
                            </div>
                        </div>

                        <div class="prob-bar">
                            <div class="prob-label">
                                <span>التعادل</span>
                                <span>${mockPrediction.ensemble.draw}%</span>
                            </div>
                            <div class="prob-fill" style="width: ${mockPrediction.ensemble.draw}%; background: var(--warning)">
                                ${mockPrediction.ensemble.draw}%
                            </div>
                        </div>

                        <div class="prob-bar">
                            <div class="prob-label">
                                <span>فوز الفريق الثاني</span>
                                <span>${mockPrediction.ensemble.away_win}%</span>
                            </div>
                            <div class="prob-fill" style="width: ${mockPrediction.ensemble.away_win}%; background: var(--danger)">
                                ${mockPrediction.ensemble.away_win}%
                            </div>
                        </div>
                    </div>

                    <div class="recommendation">
                        <h3>📊 التوصية</h3>
                        <p>${mockPrediction.recommendation}</p>
                        <span class="confidence-badge">مستوى الثقة: ${mockPrediction.confidence}%</span>
                    </div>
                </div>
            </div>

            <!-- محتوى ELO -->
            <div id="tab-elo" class="tab-content" style="display: none;">
                <div class="prediction-result">
                    <h3>🎯 تنبؤ ELO Rating</h3>
                    <p style="color: var(--text-light); margin-bottom: 2rem;">
                        نظام تصنيف متقدم يقيّم قوة الفرق بناءً على الأداء التاريخي
                    </p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                        <div style="text-align: center; background: white; padding: 20px; border-radius: 10px;">
                            <h4>تصنيف الفريق الأول</h4>
                            <div style="font-size: 3rem; font-weight: 700; color: var(--primary-color);">
                                ${mockPrediction.elo.home_elo}
                            </div>
                        </div>
                        <div style="text-align: center; background: white; padding: 20px; border-radius: 10px;">
                            <h4>تصنيف الفريق الثاني</h4>
                            <div style="font-size: 3rem; font-weight: 700; color: var(--danger);">
                                ${mockPrediction.elo.away_elo}
                            </div>
                        </div>
                    </div>

                    <div class="prob-bars">
                        <div class="prob-bar">
                            <div class="prob-label">
                                <span>فوز الفريق الأول</span>
                                <span>${mockPrediction.elo.home_win}%</span>
                            </div>
                            <div class="prob-fill" style="width: ${mockPrediction.elo.home_win}%">
                                ${mockPrediction.elo.home_win}%
                            </div>
                        </div>

                        <div class="prob-bar">
                            <div class="prob-label">
                                <span>التعادل</span>
                                <span>${mockPrediction.elo.draw}%</span>
                            </div>
                            <div class="prob-fill" style="width: ${mockPrediction.elo.draw}%; background: var(--warning)">
                                ${mockPrediction.elo.draw}%
                            </div>
                        </div>

                        <div class="prob-bar">
                            <div class="prob-label">
                                <span>فوز الفريق الثاني</span>
                                <span>${mockPrediction.elo.away_win}%</span>
                            </div>
                            <div class="prob-fill" style="width: ${mockPrediction.elo.away_win}%; background: var(--danger)">
                                ${mockPrediction.elo.away_win}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- محتوى Poisson -->
            <div id="tab-poisson" class="tab-content" style="display: none;">
                <div class="prediction-result">
                    <h3>📊 تنبؤ Poisson Distribution</h3>
                    <p style="color: var(--text-light); margin-bottom: 2rem;">
                        نموذج رياضي للتنبؤ بعدد الأهداف المتوقعة
                    </p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                        <div style="text-align: center; background: white; padding: 20px; border-radius: 10px;">
                            <h4>أهداف متوقعة - الأول</h4>
                            <div style="font-size: 3rem; font-weight: 700; color: var(--primary-color);">
                                ${mockPrediction.poisson.expected_home}
                            </div>
                        </div>
                        <div style="text-align: center; background: white; padding: 20px; border-radius: 10px;">
                            <h4>أهداف متوقعة - الثاني</h4>
                            <div style="font-size: 3rem; font-weight: 700; color: var(--danger);">
                                ${mockPrediction.poisson.expected_away}
                            </div>
                        </div>
                    </div>

                    <h4 style="margin-bottom: 1rem;">أكثر النتائج احتمالاً:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                        ${mockPrediction.poisson.likely_scores.map(score => `
                            <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-dark);">
                                    ${score.home} - ${score.away}
                                </div>
                                <div style="color: var(--text-light); font-size: 0.9rem;">
                                    ${score.probability}%
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="prob-bars">
                        <div class="prob-bar">
                            <div class="prob-label">
                                <span>فوز الفريق الأول</span>
                                <span>${mockPrediction.poisson.home_win}%</span>
                            </div>
                            <div class="prob-fill" style="width: ${mockPrediction.poisson.home_win}%">
                                ${mockPrediction.poisson.home_win}%
                            </div>
                        </div>

                        <div class="prob-bar">
                            <div class="prob-label">
                                <span>التعادل</span>
                                <span>${mockPrediction.poisson.draw}%</span>
                            </div>
                            <div class="prob-fill" style="width: ${mockPrediction.poisson.draw}%; background: var(--warning)">
                                ${mockPrediction.poisson.draw}%
                            </div>
                        </div>

                        <div class="prob-bar">
                            <div class="prob-label">
                                <span>فوز الفريق الثاني</span>
                                <span>${mockPrediction.poisson.away_win}%</span>
                            </div>
                            <div class="prob-fill" style="width: ${mockPrediction.poisson.away_win}%; background: var(--danger)">
                                ${mockPrediction.poisson.away_win}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 2rem; padding: 20px; background: #fff3cd; border-radius: 10px; text-align: center;">
                <p style="color: #856404; margin: 0;">
                    ⚠️ هذا التحليل مبني على البيانات الإحصائية ونماذج التنبؤ الرياضية. النتائج الفعلية قد تختلف.
                </p>
            </div>
        `;

    } catch (error) {
        console.error('خطأ في التنبؤ:', error);
        content.innerHTML = `
            <div class="message error">
                حدث خطأ أثناء التحليل. تأكد من تشغيل الخادم.
            </div>
        `;
    }
}

// إغلاق المودال
function closeModal() {
    document.getElementById('predictionModal').style.display = 'none';
}

// إغلاق عند النقر خارج المودال
window.onclick = function(event) {
    const modal = document.getElementById('predictionModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// التبديل بين التابات
function showTab(tabName) {
    // إخفاء جميع المحتويات
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // إزالة الفئة النشطة من جميع الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // إظهار المحتوى المحدد
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.target.classList.add('active');
}

// إظهار رسالة
function showMessage(text, type = 'success') {
    // إنشاء عنصر الرسالة
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '100px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '3000';
    messageDiv.style.minWidth = '300px';
    messageDiv.style.animation = 'slideIn 0.3s';

    document.body.appendChild(messageDiv);

    // إزالة الرسالة بعد 3 ثوان
    setTimeout(() => {
        messageDiv.style.animation = 'fadeOut 0.3s';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// توليد بيانات تنبؤ تجريبية
function generateMockPrediction(fixtureId) {
    const predictions = {
        867946: { // Liverpool vs Manchester United
            ensemble: { home_win: 54, draw: 25, away_win: 21 },
            elo: { home_win: 58, draw: 24, away_win: 18, home_elo: 1750, away_elo: 1620 },
            poisson: { 
                home_win: 52, draw: 26, away_win: 22,
                expected_home: 1.85, expected_away: 1.15,
                likely_scores: [
                    { home: 2, away: 1, probability: 18.5 },
                    { home: 1, away: 1, probability: 16.2 },
                    { home: 2, away: 0, probability: 12.8 },
                    { home: 1, away: 0, probability: 11.5 },
                    { home: 3, away: 1, probability: 9.3 }
                ]
            },
            recommendation: 'فوز الفريق الأول (Liverpool) بناءً على التحليل الشامل',
            confidence: 68
        },
        867947: { // Real Madrid vs Barcelona
            ensemble: { home_win: 48, draw: 28, away_win: 24 },
            elo: { home_win: 51, draw: 27, away_win: 22, home_elo: 1820, away_elo: 1795 },
            poisson: { 
                home_win: 45, draw: 29, away_win: 26,
                expected_home: 1.6, expected_away: 1.4,
                likely_scores: [
                    { home: 1, away: 1, probability: 19.2 },
                    { home: 2, away: 1, probability: 15.8 },
                    { home: 1, away: 2, probability: 14.1 },
                    { home: 2, away: 2, probability: 11.7 },
                    { home: 0, away: 0, probability: 10.3 }
                ]
            },
            recommendation: 'مباراة متوازنة مع ميزة طفيفة للفريق الأول (Real Madrid)',
            confidence: 55
        },
        867948: { // الهلال vs النصر
            ensemble: { home_win: 62, draw: 22, away_win: 16 },
            elo: { home_win: 65, draw: 21, away_win: 14, home_elo: 1880, away_elo: 1690 },
            poisson: { 
                home_win: 59, draw: 23, away_win: 18,
                expected_home: 2.1, expected_away: 1.0,
                likely_scores: [
                    { home: 2, away: 0, probability: 21.5 },
                    { home: 2, away: 1, probability: 18.8 },
                    { home: 3, away: 1, probability: 14.2 },
                    { home: 1, away: 0, probability: 13.1 },
                    { home: 3, away: 0, probability: 11.6 }
                ]
            },
            recommendation: 'فوز قوي متوقع للفريق الأول (الهلال) بناءً على الفورم الممتاز',
            confidence: 75
        }
    };

    return predictions[fixtureId] || predictions[867946];
}

// البحث عند الضغط على Enter
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('teamSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchTeam();
            }
        });
    }

    // إضافة تأثيرات التمرير
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .fixture-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.5s ease';
        observer.observe(el);
    });
});

// CSS إضافي للتحميل
const style = document.createElement('style');
style.textContent = `
    .loading-container {
        text-align: center;
        padding: 40px;
    }

    .loading-container p {
        margin-top: 20px;
        color: var(--text-light);
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    .team-founded {
        font-size: 0.85rem;
        color: var(--text-light);
    }
`;
document.head.appendChild(style);