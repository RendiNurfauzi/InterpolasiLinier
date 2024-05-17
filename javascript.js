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
            const canvas = linearInterpolation(img, scale);

            console.log("Hasil interpolasi ditampilkan.");
        };
        img.src = image.src;
    } else {
        console.log("Gambar sumber atau skala tidak valid.");
    }
}



function linearInterpolation(imageElement, scale) {
    const img = new Image();
    img.src = imageElement.src;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    img.onload = function() {
        const width = img.width;
        const height = img.height;
        const newWidth = Math.floor(width * scale);
        const newHeight = Math.floor(height * scale);
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.fillStyle = 'white'; // Set background color to white
        ctx.fillRect(0, 0, newWidth, newHeight); // Fill the canvas with white
        ctx.drawImage(img, 0, 0, width, height, 0, 0, newWidth, newHeight);
        console.log("Interpolasi selesai: newWidth =", newWidth, "newHeight =", newHeight);

        // Perbarui nilai lebar dan tinggi pada kolom output
        document.getElementById('kolomOutpuanWidth').value = newWidth;
        document.getElementById('kolomOutpuanHeight').value = newHeight;

        // Simpan hasil interpolasi ke file
        const link = document.createElement('a');
        link.download = 'processed_image.png';
        link.href = canvas.toDataURL();
       // link.click();
        console.log("File processed_image.png telah dibuat.");

        // Tampilkan gambar yang telah diproses di imagePreview dengan efek fade
        const displayedImage = document.getElementById('imagePreview');
        displayedImage.style.opacity = 0; // Sembunyikan gambar terlebih dahulu
        displayedImage.src = canvas.toDataURL();
        setTimeout(function() {
            displayedImage.style.opacity = 1; // Tampilkan gambar dengan efek fade
        }, 100);
        console.log("Menampilkan gambar yang telah diproses...");
    };
    return canvas;
}


function getPixel(image, x, y) {
    const ctx = image.getContext('2d');
    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    console.log("Data piksel diambil:", pixelData);
    return [pixelData[0], pixelData[1], pixelData[2]]; // RGB values
}

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
    }
});

document.getElementById('help').addEventListener('click', function() {
    console.log('HELP telah diklik.');
    var url = 'https://rendinurfauzi.github.io/InterpolasiLinier/pdf/Manual_Boox.pdf';
    window.open(url, '_blank');
});

document.getElementById('about').addEventListener('click', function() {
    console.log('ABOUT telah diklik.');
});
