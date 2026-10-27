document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const roleInput = document.getElementById('role');
  
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner');
  
  const alertBox = document.getElementById('alertBox');
  const fullNameError = document.getElementById('fullNameError');
  const emailError = document.getElementById('emailError');

  // Webhook settings - Fixed n8n Endpoints
  const WEBHOOK_URLS = {
    test: 'https://oraclen8n.dhandyanadry.my.id/webhook-test/189cfb37-13ef-4c56-b8d1-19cec7d9ee5a',
    prod: 'https://oraclen8n.dhandyanadry.my.id/webhook/189cfb37-13ef-4c56-b8d1-19cec7d9ee5a'
  };

  const webhookModeSelect = document.getElementById('webhookMode');
  const webhookInput = document.getElementById('webhookUrl');
  const webhookStatusText = document.getElementById('webhookStatusText');

  const STORAGE_KEY = 'n8n_webinar_webhook_mode';
  const savedMode = localStorage.getItem(STORAGE_KEY) || 'prod';
  
  if (webhookModeSelect) {
    webhookModeSelect.value = savedMode;
    webhookInput.value = WEBHOOK_URLS[savedMode] || WEBHOOK_URLS.prod;

    webhookModeSelect.addEventListener('change', () => {
      const mode = webhookModeSelect.value;
      webhookInput.value = WEBHOOK_URLS[mode];
      localStorage.setItem(STORAGE_KEY, mode);
      webhookStatusText.textContent = `Mode beralih ke: ${mode === 'test' ? 'Test (Listen event)' : 'Production (Workflow Active)'}`;
      setTimeout(() => {
        webhookStatusText.textContent = '';
      }, 3000);
    });
  }

  // Validation helper
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  function showAlert(message, type = 'success') {
    alertBox.className = `alert alert-${type}`;
    alertBox.innerHTML = message;
    alertBox.classList.remove('hidden');
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function clearAlert() {
    alertBox.className = 'alert hidden';
    alertBox.innerHTML = '';
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      btnText.textContent = 'Mengirim data...';
      spinner.classList.remove('hidden');
    } else {
      btnText.textContent = 'Dapatkan Tiket Masuk';
      spinner.classList.add('hidden');
    }
  }

  // Real-time input clearing
  fullNameInput.addEventListener('input', () => {
    fullNameInput.classList.remove('is-invalid');
    fullNameError.textContent = '';
  });

  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('is-invalid');
    emailError.textContent = '';
  });

  // Form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const role = roleInput.value;

    let hasError = false;

    // Validate Name
    if (!fullName) {
      fullNameInput.classList.add('is-invalid');
      fullNameError.textContent = 'Nama lengkap wajib diisi.';
      hasError = true;
    }

    // Validate Email
    if (!email) {
      emailInput.classList.add('is-invalid');
      emailError.textContent = 'Alamat email wajib diisi.';
      hasError = true;
    } else if (!validateEmail(email)) {
      emailInput.classList.add('is-invalid');
      emailError.textContent = 'Format email tidak valid (contoh: nama@domain.com).';
      hasError = true;
    }

    if (hasError) return;

    // Generate ticket ID & registration timestamp
    const ticketId = 'TCK-' + Math.floor(100000 + Math.random() * 900000);
    const registeredAt = new Date().toISOString();

    const payload = {
      ticketId,
      fullName,
      email,
      phone: phone || '-',
      role,
      eventName: 'Mastering Workflow Automation & AI dengan n8n',
      eventDate: 'Sabtu, 14 November 2026',
      eventTime: '19:30 - 21:00 WIB',
      zoomLink: 'https://zoom.us/j/9876543210?pwd=WebinarSamplePassword',
      registeredAt
    };

    const targetWebhookUrl = webhookInput.value.trim();

    setLoading(true);

    try {
      // Jika Webhook URL belum diisi, jalankan Demo Mode agar user bisa test langsung
      if (!targetWebhookUrl) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating request
        
        showAlert(`
          <strong>🎉 Registrasi Berhasil (Mode Demo)!</strong><br>
          Halo <b>${fullName}</b>, pendaftaran Anda tercatat dengan ID Tiket <code>${ticketId}</code>.<br><br>
          <em>Catatan:</em> Masukkan URL Webhook n8n Anda di bagian bar atas untuk menguji pengiriman email nyata via Gmail SMTP.
        `, 'success');
        
        form.reset();
        return;
      }

      // Kirim POST request ke Webhook n8n
      const response = await fetch(targetWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook merespons dengan status: ${response.status} ${response.statusText}`);
      }

      showAlert(`
        <strong>🎉 Pendaftaran Berhasil!</strong><br>
        Terima kasih <b>${fullName}</b>! E-Ticket dan tautan Zoom sudah dikirimkan ke <b>${email}</b> via otomatisasi n8n.<br>
        Nomor Tiket Anda: <b>${ticketId}</b>. Silakan periksa inbox atau folder spam email Anda.
      `, 'success');

      form.reset();

    } catch (err) {
      console.error('Submission error:', err);
      showAlert(`
        <strong>Gagal menghubungi Webhook n8n:</strong><br>
        ${err.message}.<br><br>
        <em>Tips:</em> Pastikan workflow n8n Anda dalam status <b>Active</b> atau Webhook Node sedang dalam mode <b>Listen for test event</b>. Jika menggunakan localhost, pastikan menggunakan n8n tunnel / webhook publik atau konfigurasi CORS webhook n8n diizinkan.
      `, 'error');
    } finally {
      setLoading(false);
    }
  });
});
