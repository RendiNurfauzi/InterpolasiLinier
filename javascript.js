function openFileManager() {
    const fileInput = document.getElementById('fileInput');
    console.log("Memulai proses membuka file manager...");
    fileInput.click(); // Memicu klik pada input file

    fileInput.onchange = function() {
        const file = fileInput.files[0];
        if (file) {
            console.log("File dipilih:", file.name);
            const reader = new FileReader();
            reader.onload = function(e) {
                const displayedImage = document.getElementById('imagePreview');
                displayedImage.src = e.target.result; // Menampilkan gambar yang dipilih
                displayedImage.style.display = 'block';
                displayedImage.setAttribute('data-image-loaded', 'true'); // Tandai bahwa gambar telah diinputkan
                console.log("Menampilkan gambar...");

                // Sembunyikan elemen-elemen setelah gambar dipilih
                document.getElementById('uploadImage').style.display = 'none';
                document.getElementById('uploadTitle').style.display = 'none';
                document.getElementById('openFileButton').style.display = 'none';
                console.log("Elemen-elemen lainnya disembunyikan.");

                // Membuat image object untuk mengambil ukuran
                const img = new Image();
                img.onload = function() {
                    document.getElementById('kolomOutpuanWidth').value = img.width;
                    document.getElementById('kolomOutpuanHeight').value = img.height;
                    console.log("Dimensi gambar diambil: width =", img.width, "height =", img.height);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file); // Membaca file sebagai URL data
        } else {
            console.log("Tidak ada file yang dipilih.");
        }
    };
}

function performInterpolation() {
    const scale = parseFloat(document.getElementById('inputArea').value);
    console.log("Skala interpolasi:", scale);
    const image = document.getElementById('imagePreview');
    if (image.src && scale) {
        console.log("Memulai proses interpolasi...");
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const srcWidth = img.width;
            const srcHeight = img.height;
            const dstWidth = Math.floor(srcWidth * scale);
            const dstHeight = Math.floor(srcHeight * scale);
            canvas.width = dstWidth;
            canvas.height = dstHeight;
            ctx.drawImage(img, 0, 0, dstWidth, dstHeight);

            applySharpening(canvas); // Apply sharpening to the interpolated image
            document.getElementById('kolomOutpuanWidth').value = canvas.width;
            document.getElementById('kolomOutpuanHeight').value = canvas.height;
            const dataUrl = canvas.toDataURL(); // Convert canvas to data URL
            const displayedImage = document.getElementById('imagePreview');
            displayedImage.src = dataUrl; // Update the src of the displayedImage element

            console.log("Hasil interpolasi dan sharpening ditampilkan.");
        };
        img.src = image.src;
    } else {
        console.log("Gambar sumber atau skala tidak valid.");
    }
}

function postProcessAndDisplay(canvas) {
    applySharpening(canvas); // Apply sharpening to the interpolated image
    const dataUrl = canvas.toDataURL(); // Convert canvas to data URL
    const displayedImage = document.getElementById('imagePreview');
    displayedImage.src = dataUrl; // Update the src of the displayedImage element
}

function linearInterpolation(imageElement, scale) {
    const img = new Image();
    img.src = imageElement.src;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    img.onload = function() {
        const srcWidth = img.width;
        const srcHeight = img.height;
        const dstWidth = Math.floor(srcWidth * scale);
        const dstHeight = Math.floor(srcHeight * scale);
        canvas.width = dstWidth;
        canvas.height = dstHeight;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, dstWidth, dstHeight);

        ctx.drawImage(img, 0, 0, srcWidth, srcHeight);
        const srcData = ctx.getImageData(0, 0, srcWidth, srcHeight).data;
        const dstImageData = ctx.createImageData(dstWidth, dstHeight);
        const dstData = dstImageData.data;

        for (let y = 0; y < dstHeight; y++) {
            for (let x = 0; x < dstWidth; x++) {
                const srcX = (x / scale);
                const srcY = (y / scale);
                const srcXFloor = Math.floor(srcX);
                const srcYFloor = Math.floor(srcY);
                const tX = srcX - srcXFloor;
                const tY = srcY - srcYFloor;

                // Clamp indices to stay within the image boundaries
                const x1 = Math.min(srcXFloor, srcWidth - 2);
                const y1 = Math.min(srcYFloor, srcHeight - 2);
                const x2 = x1 + 1;
                const y2 = y1 + 1;

                const idx = (y1 * srcWidth + x1) * 4;
                const idxRight = (y1 * srcWidth + x2) * 4;
                const idxDown = (y2 * srcWidth + x1) * 4;
                const idxDiag = (y2 * srcWidth + x2) * 4;

                // Interpolate in X direction
                const rX1 = (1 - tX) * srcData[idx] + tX * srcData[idxRight];
                const gX1 = (1 - tX) * srcData[idx + 1] + tX * srcData[idxRight + 1];
                const bX1 = (1 - tX) * srcData[idx + 2] + tX * srcData[idxRight + 2];

                const rX2 = (1 - tX) * srcData[idxDown] + tX * srcData[idxDiag];
                const gX2 = (1 - tX) * srcData[idxDown + 1] + tX * srcData[idxDiag + 1];
                const bX2 = (1 - tX) * srcData[idxDown + 2] + tX * srcData[idxDiag + 2];

                // Interpolate in Y direction
                const r = (1 - tY) * rX1 + tY * rX2;
                const g = (1 - tY) * gX1 + tY * gX2;
                const b = (1 - tY) * bX1 + tY * bX2;

                const dstIdx = (y * dstWidth + x) * 4;
                dstData[dstIdx] = r;
                dstData[dstIdx + 1] = g;
                dstData[dstIdx + 2] = b;
                dstData[dstIdx + 3] = 255; // alpha channel
            }
        }

        ctx.putImageData(dstImageData, 0, 0);
        console.log("Interpolasi selesai: newWidth =", dstWidth, "newHeight =", dstHeight);
        document.getElementById('kolomOutpuanWidth').value = dstWidth;
        document.getElementById('kolomOutpuanHeight').value = dstHeight;

        // Save the interpolated image to a file
        const link = document.createElement('a');
        link.download = 'processed_image.png';
        link.href = canvas.toDataURL();
        console.log("File processed_image.png telah dibuat.");

        // Display the processed image with a fade effect
        const displayedImage = document.getElementById('imagePreview');
        displayedImage.style.opacity = 0; // Hide the image first
        displayedImage.src = canvas.toDataURL();
        setTimeout(function() {
            displayedImage.style.opacity = 1; // Show the image with a fade effect
        }, 100);
        console.log("Menampilkan gambar yang telah diproses...");
    };
    return canvas;
}

function applySharpening(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Kernel Sharpening
    const kernel = [
        0, -1,  0,
       -1,  5, -1,
        0, -1,  0
    ];

    const sharpenedData = new Uint8ClampedArray(data.length);
    const side = Math.round(Math.sqrt(kernel.length));
    const halfSide = Math.floor(side / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0;
            for (let ky = 0; ky < side; ky++) {
                for (let kx = 0; kx < side; kx++) {
                    const sy = y + ky - halfSide;
                    const sx = x + kx - halfSide;
                    if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                        const srcOffset = (sy * width + sx) * 4;
                        const wt = kernel[ky * side + kx];
                        r += data[srcOffset] * wt;
                        g += data[srcOffset + 1] * wt;
                        b += data[srcOffset + 2] * wt;
                    }
                }
            }
            const dstOffset = (y * width + x) * 4;
            sharpenedData[dstOffset] = Math.min(Math.max(r, 0), 255);
            sharpenedData[dstOffset + 1] = Math.min(Math.max(g, 0), 255);
            sharpenedData[dstOffset + 2] = Math.min(Math.max(b, 0), 255);
            sharpenedData[dstOffset + 3] = data[dstOffset + 3]; // copy alpha channel
        }
    }

    // Update the canvas with the sharpened image data
    imageData.data.set(sharpenedData);
    ctx.putImageData(imageData, 0, 0);
}

//function getPixel(image, x, y) {
    //const ctx = image.getContext('2d');
    //const pixelData = ctx.getImageData(x, y, 1, 1).data;
    //console.log("Data piksel diambil:", pixelData);
    //return [pixelData[0], pixelData[1], pixelData[2]]; // RGB values
//}

document.getElementById('enterButton').addEventListener('click', performInterpolation);

document.getElementById('file').addEventListener('click', function(o) {
    openFileManager();
    console.log('FILE telah diklik.');
});

document.getElementById('save').addEventListener('click', function() {
    console.log('SAVE telah diklik.');
    const displayedImage = document.getElementById('imagePreview');
    if (displayedImage.getAttribute('data-image-loaded') === 'true') {
        const link = document.createElement('a');
        link.download = 'processed_image.png'; // Nama file yang akan disimpan
        link.href = displayedImage.src; // URL gambar yang akan di-download
        document.body.appendChild(link); // Menambahkan link ke body (opsional, untuk kepastian)
        link.click(); // Memulai proses download
        document.body.removeChild(link); // Menghapus link setelah klik (opsional)
    } else {
        console.log('Tidak ada gambar yang diproses untuk disimpan.');
        alert('Tidak ada gambar yang diproses untuk disimpan.'); // Menampilkan popup kesalahan
    }
});

document.getElementById('help').addEventListener('click', function() {
    console.log('HELP telah diklik.');
    document.getElementById('pdfViewer').src = 'pdf/Manual_Book.pdf';
});

document.getElementById('about').addEventListener('click', function() {
    console.log('ABOUT telah diklik.');
});

document.getElementById('cancelButton').addEventListener('click', function() {
    console.log('CANCEL telah diklik.');
    location.reload(); // Memuat ulang halaman web
});


document.addEventListener('DOMContentLoaded', function() {
    var inputArea = document.getElementById('inputArea');
    var modal = document.getElementById('myModal');
    var yesBtn = document.getElementById('yesBtn');
    var noBtn = document.getElementById('noBtn');

    inputArea.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (parseInt(this.value) > 4) {
            modal.style.display = "block";
        }
    });

    // Pastikan tombol 'Ya' dan 'Tidak' memiliki event handler yang benar
    yesBtn.onclick = function() {
        modal.style.display = "none"; // Langsung sembunyikan modal tanpa delay
    }

    noBtn.onclick = function() {
        modal.style.display = "none"; // Langsung sembunyikan modal tanpa delay
        inputArea.value = ''; // Mengosongkan textarea
    }

    span.onclick = function() {
        modal.classList.add('hide');
        setTimeout(() => { modal.style.display = "none"; modal.classList.remove('hide'); }, 500);
    }

    yesBtn.onclick = function() {
        modal.classList.add('fadeOut');
        setTimeout(() => {
            modal.style.display = "none";
            modal.classList.remove('fadeOut');
        }, 500); // Sesuaikan dengan durasi animasi
    }

    noBtn.onclick = function() {
        modal.classList.add('fadeOut');
        setTimeout(() => {
            modal.style.display = "none";
            modal.classList.remove('fadeOut');
            inputArea.value = ''; // Mengosongkan textarea
        }, 500); // Sesuaikan dengan durasi animasi
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const sr = ScrollReveal({
        origin: 'top',
        distance: '50px',
        duration: 2000,
        reset: false
    });

    // Reveal semua elemen yang relevan
    sr.reveal('.flex_col, .flex_row, .content_box, .content_box1, .content_box2, .content_box3');
    sr.reveal('.image3, .hero_title, .medium_title, .medium_title2, .medium_title3', { delay: 500 });
    sr.reveal('#uploadImage, #uploadTitle, #openFileButton', { delay: 500 });
    sr.reveal('.kolom_output, .kolom_Input', { delay: 500 });
    sr.reveal('#enterButton, #cancelButton', { interval: 200 });

});

document.addEventListener('DOMContentLoaded', function() {
    const fireflies = document.querySelectorAll('.firefly');
    const maxX = window.innerWidth;
    const maxY = window.innerHeight;

    fireflies.forEach(firefly => {
        let randomX = Math.random() * maxX;
        let randomY = Math.random() * maxY;
        let targetX = Math.random() * maxX;
        let targetY = Math.random() * maxY;
        const speed = 0.0075; // Kecepatan gerakan firefly

        // Atur variabel CSS untuk glow
        firefly.style.setProperty('--min-glow-size', `${Math.random() * 25 + 30}px`);
        firefly.style.setProperty('--min-glow-intensity', `${Math.random() * 15 + 30}px`);
        firefly.style.setProperty('--max-glow-size', `${Math.random() * - + 15}px`);
        firefly.style.setProperty('--max-glow-intensity', `${Math.random() * 15 + 25}px`);

        const glowDelay = Math.random() * 5; // Delay antara 0 hingga 5 detik
        firefly.style.animation = `glow 4s ${glowDelay}s infinite ease-in-out`;

        firefly.style.left = `${randomX}px`;
        firefly.style.top = `${randomY}px`;

        function moveFirefly() {
            const dx = targetX - randomX;
            const dy = targetY - randomY;
            randomX += dx * speed;
            randomY += dy * speed;
            firefly.style.left = `${randomX}px`;
            firefly.style.top = `${randomY}px`;

            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                targetX = Math.random() * maxX;
                targetY = Math.random() * maxY;
            }
            requestAnimationFrame(moveFirefly);
        }
        moveFirefly();
    });
});



