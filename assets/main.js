// ===== WORD COUNTER =====
function initWordCounter() {
    const textarea = document.getElementById('wordCountText');
    if (!textarea) return;

    const wordCount = document.getElementById('wordCount');
    const charCount = document.getElementById('charCount');
    const charNoSpaceCount = document.getElementById('charNoSpaceCount');
    const sentenceCount = document.getElementById('sentenceCount');
    const paragraphCount = document.getElementById('paragraphCount');
    const readingTime = document.getElementById('readingTime');

    function updateCounts() {
        const text = textarea.value;
        
        // Words
        const words = text.trim() === '' ? [] : text.trim().split(/\s+/).filter(word => word.length > 0);
        if (wordCount) wordCount.textContent = words.length;
        
        // Characters
        if (charCount) charCount.textContent = text.length;
        if (charNoSpaceCount) charNoSpaceCount.textContent = text.replace(/\s/g, '').length;
        
        // Sentences
        const sentences = text.trim() === '' ? [] : text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentenceCount) sentenceCount.textContent = sentences.length;
        
        // Paragraphs
        const paragraphs = text.trim() === '' ? [] : text.split(/\n+/).filter(p => p.trim().length > 0);
        if (paragraphCount) paragraphCount.textContent = paragraphs.length;
        
        // Reading time (average 200 words per minute)
        const minutes = words.length === 0 ? 0 : Math.ceil(words.length / 200);
        if (readingTime) readingTime.textContent = minutes;
    }

    textarea.addEventListener('input', updateCounts);
    updateCounts();
}

// ===== TEXT CASE CONVERTER =====
function convertCase(caseType) {
    const textarea = document.getElementById('caseText');
    if (!textarea) return;
    
    const text = textarea.value;
    let result = text;

    switch(caseType) {
        case 'upper':
            result = text.toUpperCase();
            break;
        case 'lower':
            result = text.toLowerCase();
            break;
        case 'title':
            result = text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
            break;
        case 'sentence':
            result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, char => char.toUpperCase());
            break;
        case 'capitalize':
            result = text.replace(/\b\w/g, char => char.toUpperCase());
            break;
        case 'alternate':
            result = text.split('').map((char, i) => i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()).join('');
            break;
    }

    textarea.value = result;
}

function copyText() {
    const textarea = document.getElementById('caseText');
    if (!textarea) return;
    
    textarea.select();
    document.execCommand('copy');
    alert('Text copied to clipboard!');
}

function clearText() {
    const textarea = document.getElementById('caseText');
    if (!textarea) return;
    
    textarea.value = '';
}

// ===== QR CODE GENERATOR =====
function initQRGenerator() {
    const input = document.getElementById('qrText');
    const generateBtn = document.getElementById('generateQR');
    const qrcodeDiv = document.getElementById('qrcode');
    const sizeSelect = document.getElementById('qrSize');
    
    if (!input || !generateBtn || !qrcodeDiv) return;

    generateBtn.addEventListener('click', function() {
        const text = input.value.trim();
        if (!text) {
            alert('Please enter text or URL to generate QR code');
            return;
        }

        const size = sizeSelect ? parseInt(sizeSelect.value) || 300 : 300;
        qrcodeDiv.innerHTML = '';
        
        try {
            // Check if QRCode library is available
            if (typeof QRCode !== 'undefined') {
                const qr = new QRCode(qrcodeDiv, {
                    text: text,
                    width: size,
                    height: size,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.M
                });

                // Add download button after generation
                setTimeout(() => {
                    const canvas = qrcodeDiv.querySelector('canvas');
                    if (canvas) {
                        const downloadBtn = document.createElement('button');
                        downloadBtn.textContent = 'Download QR Code';
                        downloadBtn.className = 'btn mt-1';
                        downloadBtn.style.marginTop = '1rem';
                        downloadBtn.onclick = function() {
                            const link = document.createElement('a');
                            link.href = canvas.toDataURL();
                            link.download = 'qrcode.png';
                            link.click();
                        };
                        qrcodeDiv.appendChild(downloadBtn);
                    }
                }, 100);
            } else {
                // Fallback to Google Charts API if local library fails
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
                const img = document.createElement('img');
                img.src = qrUrl;
                img.alt = 'QR Code';
                img.style.maxWidth = '100%';
                img.style.borderRadius = '8px';
                qrcodeDiv.appendChild(img);
                
                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = 'Download QR Code';
                downloadBtn.className = 'btn mt-1';
                downloadBtn.style.marginTop = '1rem';
                downloadBtn.onclick = function() {
                    const link = document.createElement('a');
                    link.href = qrUrl;
                    link.download = 'qrcode.png';
                    link.click();
                };
                qrcodeDiv.appendChild(downloadBtn);
            }
        } catch (error) {
            console.error('QR Code generation error:', error);
            qrcodeDiv.innerHTML = '<p style="color: red;">Error generating QR code. Please try again.</p>';
        }
    });
}

// ===== IMAGE COMPRESSOR =====
function initImageCompressor() {
    const fileInput = document.getElementById('imageInput');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const compressBtn = document.getElementById('compressBtn');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const downloadBtn = document.getElementById('downloadCompressed');

    if (!fileInput) return;

    let compressedBlob = null;

    if (qualitySlider) {
        qualitySlider.addEventListener('input', function() {
            if (qualityValue) qualityValue.textContent = this.value + '%';
        });
    }

    if (compressBtn) {
        compressBtn.addEventListener('click', function() {
            const file = fileInput.files[0];
            if (!file) {
                alert('Please select an image first');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Show original
                    if (originalPreview) {
                        originalPreview.src = e.target.result;
                        originalPreview.style.display = 'block';
                    }
                    if (originalSize) {
                        originalSize.textContent = (file.size / 1024).toFixed(2) + ' KB';
                    }

                    // Compress
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const quality = qualitySlider ? qualitySlider.value / 100 : 0.8;
                    canvas.toBlob(function(blob) {
                        compressedBlob = blob;
                        const url = URL.createObjectURL(blob);
                        if (compressedPreview) {
                            compressedPreview.src = url;
                            compressedPreview.style.display = 'block';
                        }
                        if (compressedSize) {
                            compressedSize.textContent = (blob.size / 1024).toFixed(2) + ' KB';
                        }
                        if (downloadBtn) {
                            downloadBtn.style.display = 'block';
                        }
                        // Show result box
                        const resultBox = document.getElementById('resultBox');
                        if (resultBox) {
                            resultBox.style.display = 'block';
                        }
                    }, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (!compressedBlob) return;
            const url = URL.createObjectURL(compressedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'compressed-image.jpg';
            link.click();
        });
    }
}

// ===== JPG <-> PNG CONVERTER =====
function initImageConverter() {
    const fileInput = document.getElementById('converterInput');
    const formatSelect = document.getElementById('outputFormat');
    const convertBtn = document.getElementById('convertBtn');
    const previewImg = document.getElementById('previewImg');
    const downloadBtn = document.getElementById('downloadConverted');

    if (!fileInput) return;

    let convertedBlob = null;

    if (convertBtn) {
        convertBtn.addEventListener('click', function() {
            const file = fileInput.files[0];
            if (!file) {
                alert('Please select an image first');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    
                    // For PNG, fill with white background
                    if (formatSelect && formatSelect.value === 'png') {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.drawImage(img, 0, 0);

                    const mimeType = formatSelect && formatSelect.value === 'png' ? 'image/png' : 'image/jpeg';
                    canvas.toBlob(function(blob) {
                        convertedBlob = blob;
                        const url = URL.createObjectURL(blob);
                        if (previewImg) {
                            previewImg.src = url;
                            previewImg.style.display = 'block';
                        }
                        if (downloadBtn) {
                            downloadBtn.style.display = 'block';
                        }
                    }, mimeType, 0.95);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (!convertedBlob) return;
            const url = URL.createObjectURL(convertedBlob);
            const link = document.createElement('a');
            link.href = url;
            const extension = formatSelect ? formatSelect.value : 'jpg';
            link.download = `converted-image.${extension}`;
            link.click();
        });
    }
}

// ===== IMAGE TO PDF =====
function initImageToPDF() {
    const fileInput = document.getElementById('pdfImageInput');
    const convertBtn = document.getElementById('convertToPDF');
    const previewImg = document.getElementById('pdfPreviewImg');
    const downloadBtn = document.getElementById('downloadPDF');

    if (!fileInput) return;

    let pdfBlob = null;

    if (convertBtn) {
        convertBtn.addEventListener('click', function() {
            const file = fileInput.files[0];
            if (!file) {
                alert('Please select an image first');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    if (previewImg) {
                        previewImg.src = e.target.result;
                        previewImg.style.display = 'block';
                    }

                    // Create PDF-sized canvas (A4 proportions)
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // A4 size ratio (210mm x 297mm)
                    const a4Width = 595;
                    const a4Height = 842;
                    const imgRatio = img.width / img.height;
                    const a4Ratio = a4Width / a4Height;
                    
                    let canvasWidth, canvasHeight;
                    if (imgRatio > a4Ratio) {
                        canvasWidth = a4Width;
                        canvasHeight = a4Width / imgRatio;
                    } else {
                        canvasHeight = a4Height;
                        canvasWidth = a4Height * imgRatio;
                    }
                    
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

                    // Convert to blob
                    canvas.toBlob(function(blob) {
                        pdfBlob = blob;
                        if (downloadBtn) {
                            downloadBtn.style.display = 'block';
                        }
                    }, 'image/png');
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (!pdfBlob) return;
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'image-to-pdf.png';
            link.click();
        });
    }
}

// ===== BMI CALCULATOR =====
function initBMICalculator() {
    const calculateBtn = document.getElementById('calculateBMI');
    if (!calculateBtn) return;

    calculateBtn.addEventListener('click', function() {
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const unit = document.getElementById('unit').value;

        if (!weight || !height || weight <= 0 || height <= 0) {
            alert('Please enter valid weight and height values');
            return;
        }

        let bmi;
        if (unit === 'metric') {
            // height in cm, weight in kg
            bmi = weight / Math.pow(height / 100, 2);
        } else {
            // height in inches, weight in lbs
            bmi = (weight / Math.pow(height, 2)) * 703;
        }

        let category, color;
        if (bmi < 18.5) {
            category = 'Underweight';
            color = '#3b82f6';
        } else if (bmi < 25) {
            category = 'Normal weight';
            color = '#10b981';
        } else if (bmi < 30) {
            category = 'Overweight';
            color = '#f59e0b';
        } else {
            category = 'Obese';
            color = '#ef4444';
        }

        const resultDiv = document.getElementById('bmiResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <h3>Your Results</h3>
                <div class="stat-item" style="margin-top: 1rem;">
                    <div class="stat-value" style="color: ${color}">${bmi.toFixed(1)}</div>
                    <div class="stat-label">BMI</div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-light); border-radius: 8px;">
                    <p style="font-weight: 600; color: ${color}; font-size: 1.25rem;">${category}</p>
                    <p style="margin-top: 0.5rem; color: var(--text-light);">
                        ${getBMIAdvice(category)}
                    </p>
                </div>
            `;
            resultDiv.style.display = 'block';
        }
    });

    function getBMIAdvice(category) {
        const advice = {
            'Underweight': 'Consider consulting with a healthcare provider about healthy ways to gain weight.',
            'Normal weight': 'Great! Maintain your healthy weight through balanced diet and regular exercise.',
            'Overweight': 'Consider adopting healthier eating habits and increasing physical activity.',
            'Obese': 'Consult with a healthcare provider for a personalized weight management plan.'
        };
        return advice[category] || '';
    }
}

// ===== LOAN EMI CALCULATOR =====
function initEMICalculator() {
    const calculateBtn = document.getElementById('calculateEMI');
    if (!calculateBtn) return;

    calculateBtn.addEventListener('click', function() {
        const principal = parseFloat(document.getElementById('principal').value);
        const rate = parseFloat(document.getElementById('rate').value);
        const tenure = parseFloat(document.getElementById('tenure').value);

        if (!principal || !rate || !tenure || principal <= 0 || rate <= 0 || tenure <= 0) {
            alert('Please enter valid values for all fields');
            return;
        }

        // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
        const monthlyRate = rate / 12 / 100;
        const months = tenure * 12;
        
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                    (Math.pow(1 + monthlyRate, months) - 1);
        
        const totalAmount = emi * months;
        const totalInterest = totalAmount - principal;

        const resultDiv = document.getElementById('emiResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <h3>Your EMI Breakdown</h3>
                <div class="stats" style="margin-top: 1rem;">
                    <div class="stat-item">
                        <div class="stat-value">$${emi.toFixed(2)}</div>
                        <div class="stat-label">Monthly EMI</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">$${principal.toFixed(2)}</div>
                        <div class="stat-label">Principal Amount</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">$${totalInterest.toFixed(2)}</div>
                        <div class="stat-label">Total Interest</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">$${totalAmount.toFixed(2)}</div>
                        <div class="stat-label">Total Amount</div>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
        }
    });
}

// ===== YOUTUBE THUMBNAIL FINDER =====
function initYouTubeThumbnail() {
    const input = document.getElementById('youtubeUrl');
    const findBtn = document.getElementById('findThumbnail');
    const resultDiv = document.getElementById('thumbnailResult');

    if (!findBtn) return;

    findBtn.addEventListener('click', function() {
        const url = input.value.trim();
        if (!url) {
            alert('Please enter a YouTube URL');
            return;
        }

        // Extract video ID
        let videoId = null;
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                videoId = match[1];
                break;
            }
        }

        if (!videoId) {
            alert('Invalid YouTube URL. Please enter a valid YouTube video URL.');
            return;
        }

        const thumbnails = [
            { name: 'Max Resolution', url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` },
            { name: 'Standard Definition', url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg` },
            { name: 'High Quality', url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
            { name: 'Medium Quality', url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
            { name: 'Default', url: `https://img.youtube.com/vi/${videoId}/default.jpg` }
        ];

        let html = '<h3>Available Thumbnails</h3>';
        thumbnails.forEach(thumb => {
            html += `
                <div style="margin-top: 1.5rem;">
                    <h4 style="margin-bottom: 0.5rem;">${thumb.name}</h4>
                    <img src="${thumb.url}" alt="${thumb.name}" style="max-width: 100%; border-radius: 8px; box-shadow: var(--card-shadow);" onerror="this.style.display='none';">
                    <br>
                    <a href="${thumb.url}" download="youtube-thumbnail-${thumb.name.toLowerCase().replace(/\s/g, '-')}.jpg" class="btn" style="display: inline-block; margin-top: 0.5rem;">Download</a>
                </div>
            `;
        });

        if (resultDiv) {
            resultDiv.innerHTML = html;
            resultDiv.style.display = 'block';
        }
    });
}

// Initialize all tools when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all tools
    initWordCounter();
    initQRGenerator();
    initImageCompressor();
    initImageConverter();
    initImageToPDF();
    initBMICalculator();
    initEMICalculator();
    initYouTubeThumbnail();
    
    // Add mobile-friendly touch events
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        btn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Improve mobile textarea experience
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('focus', function() {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
    });
});

// Add error handling for missing elements
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
});

// Ensure all functions are available globally
window.convertCase = convertCase;
window.copyText = copyText;
window.clearText = clearText;