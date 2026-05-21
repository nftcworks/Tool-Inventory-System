// Tool Inventory System - Application Logic

// Local fallback database of tools in case tools.json cannot be fetched due to browser CORS policies in local files
const LOCAL_TOOLS_DATABASE = [
  {
    "id": "pwr-001",
    "name": "DeWalt Cordless Drill 20V",
    "barcode": "8800112233",
    "category": "Power tools",
    "description": "High performance 20V Max cordless drill/driver. Keyless chuck.",
    "specs": "20V Max, 2-Speed, 1/2-inch Chuck"
  },
  {
    "id": "pwr-002",
    "name": "Makita Circular Saw 7-1/4\"",
    "barcode": "8800112244",
    "category": "Power tools",
    "description": "Powerful 15 Amp motor circular saw for heavy-duty cutting.",
    "specs": "15 Amp, 5800 RPM, 7-1/4\" Blade"
  },
  {
    "id": "pwr-003",
    "name": "Bosch Angle Grinder 4-1/2\"",
    "barcode": "8800112255",
    "category": "Power tools",
    "description": "Professional high-power motor grinder for grinding, cutting, and brushing.",
    "specs": "6.0 Amp, 11000 RPM, Lock-on switch"
  },
  {
    "id": "pwr-004",
    "name": "Ryobi Corded Jigsaw 4.8A",
    "barcode": "8800112266",
    "category": "Power tools",
    "description": "Orbital jigsaw with SpeedMatch selector and integrated laser pointer.",
    "specs": "4.8 Amp, 0-3000 SPM, Toolless blade clamp"
  },
  {
    "id": "pwr-005",
    "name": "Wagner Dual-Temp Heat Gun",
    "barcode": "8800112277",
    "category": "Power tools",
    "description": "Dual temperature settings (750°F and 1000°F) for paint stripping and thawing.",
    "specs": "1200 Watts, Dual Heat Settings"
  },
  {
    "id": "hnd-001",
    "name": "Stanley Claw Hammer 16oz",
    "barcode": "9900112233",
    "category": "Hand tools",
    "description": "Fiberglass claw hammer for strength, durability, and shock absorption.",
    "specs": "16 oz head, Rip claw, Slip-resistant grip"
  },
  {
    "id": "hnd-002",
    "name": "Craftsman Screwdriver Set (8-Piece)",
    "barcode": "9900112244",
    "category": "Hand tools",
    "description": "Assorted Phillips and slotted screwdrivers with magnetic tips.",
    "specs": "Chrome-plated blades, Satin-grip handles"
  },
  {
    "id": "hnd-003",
    "name": "Crescent Adjustable Wrench 10\"",
    "barcode": "9900112255",
    "category": "Hand tools",
    "description": "Wider jaw opening adjustable wrench, chrome finish.",
    "specs": "10-inch length, 1-5/16\" jaw capacity"
  },
  {
    "id": "hnd-004",
    "name": "Knipex Combination Pliers 8\"",
    "barcode": "9900112266",
    "category": "Hand tools",
    "description": "Heavy duty linesman combination pliers for gripping, bending, and cutting.",
    "specs": "8-inch length, Multi-component handles"
  },
  {
    "id": "hnd-005",
    "name": "Lufkin Tape Measure 25ft",
    "barcode": "9900112277",
    "category": "Hand tools",
    "description": "Self-locking measuring tape with easy-to-read markings and belt clip.",
    "specs": "25-foot length, 1-inch width blade"
  },
  {
    "id": "mat-001",
    "name": "Wood Screws Box (100pcs)",
    "barcode": "7700112233",
    "category": "Materials",
    "description": "#8 x 2-inch flat head zinc-plated Phillips wood screws.",
    "specs": "100-pack, #8 Thread size, 2\" length"
  },
  {
    "id": "mat-002",
    "name": "Gorilla Wood Glue 18oz",
    "barcode": "7700112244",
    "category": "Materials",
    "description": "Water-resistant, high-strength wood adhesive for carpentry and repairs.",
    "specs": "18 oz, Natural wood color finish"
  },
  {
    "id": "mat-003",
    "name": "3M Sandpaper Variety Pack",
    "barcode": "7700112255",
    "category": "Materials",
    "description": "Assorted grits (80, 120, 220) for wood, metal, and plastic sanding.",
    "specs": "9 x 11 inch sheets, 5-pack assortment"
  },
  {
    "id": "mat-004",
    "name": "Gorilla Heavy Duty Duct Tape",
    "barcode": "7700112266",
    "category": "Materials",
    "description": "Thick double-adhesive duct tape. Weatherproof shell.",
    "specs": "1.88\" x 35 yd, Black, Extra strong grip"
  },
  {
    "id": "mat-005",
    "name": "Scotch Electrical Tape Black",
    "barcode": "7700112277",
    "category": "Materials",
    "description": "Vinyl electrical insulating tape, fire-retardant and weather-resistant.",
    "specs": "3/4\" x 66 ft, 7 mil thickness"
  }
];

// App state
let state = {
  currentStep: 1,
  tools: [],
  cart: [],
  user: {
    identifier: '',
    password: '',
    authMethod: 'password'
  },
  studentInfo: {
    name: '',
    course: '',
    section: '',
    instructor: '',
    subject: ''
  },
  isVerified: false,
  activeCategoryFilter: 'all',
  searchQuery: '',
  transactionId: '',
  timestamp: '',
  isSignUpMode: false,
  sheetId: localStorage.getItem('inventory_sheet_id') || '',
  sheetTab: localStorage.getItem('inventory_sheet_tab') || 'Inventory',
  apiUrl: localStorage.getItem('inventory_api_url') || '',
  isSynced: localStorage.getItem('inventory_is_synced') === 'true'
};

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  // Detect admin flag in URL
  state.isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

  loadToolsDatabase();
  setupEventListeners();
  updateStepUI();
  applyAdminUI();
});

// Load catalog database from Google Sheets, cache, JSON or fallback
function loadToolsDatabase() {
  if (state.isSynced && state.sheetId) {
    const cached = localStorage.getItem('cached_sheet_tools');
    if (cached) {
      try {
        state.tools = JSON.parse(cached);
        console.log('Loaded inventory from Google Sheet local cache.');
        initializeUI();
        // Silent sync in background to update
        syncGoogleSheet(state.sheetId, state.sheetTab, true);
        return;
      } catch (e) {
        console.error('Error parsing cached sheet tools, forcing fresh sync.', e);
      }
    }
    // No cache, force active sync
    syncGoogleSheet(state.sheetId, state.sheetTab, false);
  } else {
    // Standard mock fallback
    fetch('tools.json')
      .then(response => {
        if (!response.ok) throw new Error('Network response not ok');
        return response.json();
      })
      .then(data => {
        state.tools = data.tools || LOCAL_TOOLS_DATABASE;
        initializeUI();
      })
      .catch(error => {
        console.warn('Could not fetch tools.json. Using pre-loaded mock catalog.', error);
        state.tools = LOCAL_TOOLS_DATABASE;
        initializeUI();
      });
  }
}

function initializeUI() {
  renderToolsGrid();
  renderSimulatorPills();
  updateDeveloperPayload();
}

function openSettingsModal() {
  const settingsModal = document.getElementById('settings-modal');
  if (!settingsModal) return;
  settingsModal.classList.add('open');
  populateSettingsInputs();
}

function closeSettingsModal() {
  const settingsModal = document.getElementById('settings-modal');
  if (!settingsModal) return;
  settingsModal.classList.remove('open');
}

function openEditDetailsFlow() {
  openDetailsEditorModal();
}

function openDetailsEditorModal() {
  const detailsModal = document.getElementById('details-modal');
  if (!detailsModal) return;

  const nameInput = document.getElementById('details-student-name');
  const courseSelect = document.getElementById('details-student-course');
  const sectionSelect = document.getElementById('details-student-section');
  const instructorInput = document.getElementById('details-student-instructor');
  const subjectInput = document.getElementById('details-student-subject');

  if (nameInput) nameInput.value = state.studentInfo.name || '';
  if (courseSelect) {
    courseSelect.value = state.studentInfo.course || '';
    courseSelect.dispatchEvent(new Event('change'));
  }

  setTimeout(() => {
    if (sectionSelect && state.studentInfo.section) {
      const targetOption = Array.from(sectionSelect.options).find(opt => opt.value === state.studentInfo.section);
      if (targetOption) targetOption.selected = true;
    }
  }, 10);

  if (instructorInput) instructorInput.value = state.studentInfo.instructor || '';
  if (subjectInput) subjectInput.value = state.studentInfo.subject || '';

  detailsModal.classList.add('open');
}

function closeDetailsEditorModal() {
  const detailsModal = document.getElementById('details-modal');
  if (!detailsModal) return;
  detailsModal.classList.remove('open');
}

function saveDetailsFromEditor() {
  const name = document.getElementById('details-student-name').value.trim();
  const course = document.getElementById('details-student-course').value;
  const section = document.getElementById('details-student-section').value;
  const instructor = document.getElementById('details-student-instructor').value.trim();
  const subject = document.getElementById('details-student-subject').value.trim();

  if (!name || !course || !section || !instructor || !subject) {
    showToast('Please fill in all fields');
    return false;
  }

  state.studentInfo = { name, course, section, instructor, subject };

  const userNameEl = document.getElementById('dashboard-user-name');
  if (userNameEl) {
    userNameEl.innerText = state.studentInfo.name || state.user.identifier || 'User';
  }

  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarCourse = document.getElementById('sidebar-user-course');
  if (sidebarName) sidebarName.innerText = state.studentInfo.name || state.user.identifier || 'Borrower Name';
  if (sidebarCourse) {
    sidebarCourse.innerText = formatSidebarCourseSummary(state.studentInfo.course, state.studentInfo.section);
  }

  updateDeveloperPayload();
  showToast('Borrower details updated');
  return true;
}

function performLogout() {
  state.cart = [];
  state.user = { identifier: '', password: '', authMethod: 'password' };
  state.studentInfo = { name: '', course: '', section: '', instructor: '', subject: '' };
  state.isVerified = false;
  document.getElementById('student-form').reset();
  document.getElementById('login-form').reset();
  goToStep(1);
  showToast('Logged out successfully');
}

function formatSidebarCourseSummary(course, section) {
  if (!course && !section) return 'Course & Section';
  const abbreviationMatch = (course || '').match(/\(([^)]+)\)/);
  const abbreviation = abbreviationMatch ? abbreviationMatch[1] : '';
  if (abbreviation && section) return `${abbreviation} - ${section}`;
  if (section) return section;
  return abbreviation || course;
}

function setupEventListeners() {
  // Navigation / Auth Validation
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const studentNumberInput = document.getElementById('student-number');
    const studentNumber = studentNumberInput.value.trim().toUpperCase();
    const password = document.getElementById('password').value;
    
    // Validate Student Number pattern (e.g. 2024-11729-MN-0)
    const studentNumberRegex = /^\d{4}-\d{5}-[A-Z]{2}-\d$/;
    if (!studentNumberRegex.test(studentNumber)) {
      showToast('Please enter a valid student number (e.g., 2024-11729-MN-0)');
      return;
    }

    // Perform verification checks in Create Account mode
    if (state.isSignUpMode) {
      const confirmStudentNumInput = document.getElementById('confirm-student-number');
      const confirmStudentNum = confirmStudentNumInput.value.trim().toUpperCase();
      const confirmPassword = document.getElementById('confirm-password').value;
      
      if (studentNumber !== confirmStudentNum) {
        showToast('Student Numbers do not match');
        return;
      }
      
      if (password !== confirmPassword) {
        showToast('Passwords do not match');
        return;
      }
    }
    
    if (password.length < 5) {
      showToast('Password must be at least 5 characters');
      return;
    }
    
    state.user.identifier = studentNumber;
    state.user.password = password; // Mock save
    state.user.authMethod = 'password';
    
    // Normalize input field text to uppercase format
    studentNumberInput.value = studentNumber;
    if (state.isSignUpMode) {
      const confirmStudentNumInput = document.getElementById('confirm-student-number');
      if (confirmStudentNumInput) confirmStudentNumInput.value = studentNumber;
    }
    
    // Try to look up the user profile (skip Step 2 if found)
    lookupUserProfile(studentNumber, password);
  });

  // Auth Mode Toggle (Sign In / Sign Up)
  const toggleAuthBtn = document.getElementById('toggle-auth-mode-btn');
  if (toggleAuthBtn) {
    toggleAuthBtn.addEventListener('click', () => {
      state.isSignUpMode = !state.isSignUpMode;
      updateAuthUI();
    });
  }

  // Step 1 Back to Sign In Arrow Button (Sign Up mode only)
  const backSignInBtn = document.getElementById('btn-back-signin');
  if (backSignInBtn) {
    backSignInBtn.addEventListener('click', () => {
      state.isSignUpMode = false;
      updateAuthUI();
    });
  }

  // Course change to dynamically populate sections
  const courseSelect = document.getElementById('student-course');
  if (courseSelect) {
    courseSelect.addEventListener('change', () => {
      updateSectionOptions();
    });
  }

  // Student Info Validation
  document.getElementById('student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('student-name').value.trim();
    const course = document.getElementById('student-course').value;
    const section = document.getElementById('student-section').value;
    const instructor = document.getElementById('student-instructor').value.trim();
    const subject = document.getElementById('student-subject').value.trim();
    
    if (!name || !course || !section || !instructor || !subject) {
      showToast('Please fill in all fields');
      return;
    }
    
    state.studentInfo = { name, course, section, instructor, subject };
    goToStep(3);
    showToast('Student information saved');
  });

  // Step 2 Back Button
  document.getElementById('btn-back-step1').addEventListener('click', () => {
    goToStep(1);
  });

  // Step 3 Logout Button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      performLogout();
    });
  }

  // Shared settings controls
  const settingsActionEditDetails = document.getElementById('settings-action-edit-details');
  const settingsActionSync = document.getElementById('settings-action-sync');
  const settingsActionJson = document.getElementById('settings-action-json');
  const settingsActionLogout = document.getElementById('settings-action-logout');
  // Prefer new header hamburger for mobile; fallback to old id if present
  const navSettingsBtn = document.getElementById('nav-hamburger-right') || document.getElementById('nav-settings-btn');

  if (settingsActionEditDetails) {
    settingsActionEditDetails.addEventListener('click', () => {
      openEditDetailsFlow();
      closeSettingsModal();
    });
  }

  if (settingsActionSync) {
    settingsActionSync.addEventListener('click', () => {
      const syncInput = document.getElementById('setting-spreadsheet-id');
      if (syncInput) syncInput.focus();
    });
  }

  if (settingsActionJson) {
    settingsActionJson.addEventListener('click', () => {
      const drawer = document.getElementById('developer-drawer');
      if (drawer) drawer.classList.add('open');
      closeSettingsModal();
    });
  }

  if (settingsActionLogout) {
    settingsActionLogout.addEventListener('click', () => {
      performLogout();
      closeSettingsModal();
    });
  }

  if (navSettingsBtn) {
    navSettingsBtn.addEventListener('click', () => {
      openSettingsModal();
    });
  }

  // New Sidebar Actions (Desktop)
  const sidebarEditProfile = document.getElementById('sidebar-edit-profile');
  const sidebarSyncSettings = document.getElementById('sidebar-sync-settings');
  const sidebarApiSettings = document.getElementById('sidebar-api-settings');
  const sidebarLogout = document.getElementById('sidebar-logout');

  if (sidebarEditProfile) sidebarEditProfile.addEventListener('click', () => openEditDetailsFlow());
  if (sidebarSyncSettings) sidebarSyncSettings.addEventListener('click', () => openSettingsModal());
  if (sidebarApiSettings) sidebarApiSettings.addEventListener('click', () => {
    const drawer = document.getElementById('developer-drawer');
    if (drawer) drawer.classList.add('open');
  });
  if (sidebarLogout) sidebarLogout.addEventListener('click', () => performLogout());

  const detailsForm = document.getElementById('details-form');
  const btnCloseDetails = document.getElementById('btn-close-details');
  const btnDetailsCancel = document.getElementById('btn-details-cancel');
  const detailsModal = document.getElementById('details-modal');

  if (detailsForm) {
    detailsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (saveDetailsFromEditor()) {
        closeDetailsEditorModal();
      }
    });
  }

  if (btnCloseDetails) {
    btnCloseDetails.addEventListener('click', () => {
      closeDetailsEditorModal();
    });
  }

  if (btnDetailsCancel) {
    btnDetailsCancel.addEventListener('click', () => {
      closeDetailsEditorModal();
    });
  }

  if (detailsModal) {
    detailsModal.addEventListener('click', (e) => {
      if (e.target === detailsModal) {
        closeDetailsEditorModal();
      }
    });
  }

  const detailsCourseSelect = document.getElementById('details-student-course');
  if (detailsCourseSelect) {
    detailsCourseSelect.addEventListener('change', () => {
      const sectionSelect = document.getElementById('details-student-section');
      if (!sectionSelect) return;

      const courseVal = detailsCourseSelect.value;
      sectionSelect.innerHTML = '';

      if (!courseVal) {
        sectionSelect.disabled = true;
        const opt = document.createElement('option');
        opt.value = '';
        opt.disabled = true;
        opt.selected = true;
        opt.innerText = 'Select course first...';
        sectionSelect.appendChild(opt);
        return;
      }

      sectionSelect.disabled = false;
      const placeholderOpt = document.createElement('option');
      placeholderOpt.value = '';
      placeholderOpt.disabled = true;
      placeholderOpt.selected = true;
      placeholderOpt.innerText = 'Select section & year...';
      sectionSelect.appendChild(placeholderOpt);

      const abbrevMatch = courseVal.match(/\(([^)]+)\)/);
      const abbrev = abbrevMatch ? abbrevMatch[1] : '';

      for (let s = 1; s <= 3; s++) {
        for (let y = 1; y <= 3; y++) {
          const optVal = `${abbrev} ${s}-${y}`;
          const opt = document.createElement('option');
          opt.value = optVal;
          opt.innerText = optVal;
          sectionSelect.appendChild(opt);
        }
      }
    });
  }

  // Mobile Navigation Tabs
  const navCatalogBtn = document.getElementById('nav-catalog-btn');
  const navCartBtn = document.getElementById('nav-cart-btn');
  const step3Card = document.getElementById('step3-card');
  const navScanBtn = document.getElementById('nav-scan-btn');

  if (navCatalogBtn) {
    navCatalogBtn.addEventListener('click', () => {
      navCatalogBtn.classList.add('active');
      if (navCartBtn) navCartBtn.classList.remove('active');
      if (step3Card) {
        step3Card.classList.remove('mobile-view-cart');
        step3Card.classList.add('mobile-view-catalog');
      }
    });
  }

  if (navCartBtn) {
    navCartBtn.addEventListener('click', () => {
      navCartBtn.classList.add('active');
      if (navCatalogBtn) navCatalogBtn.classList.remove('active');
      if (step3Card) {
        step3Card.classList.remove('mobile-view-catalog');
        step3Card.classList.add('mobile-view-cart');
      }
    });
  }
  
  if (navScanBtn) {
    navScanBtn.addEventListener('click', () => {
      const btnOpenScanner = document.getElementById('btn-open-scanner');
      if (btnOpenScanner) btnOpenScanner.click();
    });
  }

  // Step 3 Submit Action
  document.getElementById('btn-submit-booking').addEventListener('click', () => {
    if (state.cart.length === 0) {
      showToast('Please add at least one tool to borrow');
      return;
    }
    
    const verificationCheckbox = document.getElementById('verify-list-checkbox');
    if (!verificationCheckbox.checked) {
      const vBox = document.getElementById('verification-box');
      vBox.classList.add('error-state');
      // Shake animation
      vBox.style.animation = 'none';
      vBox.offsetHeight; /* trigger reflow */
      vBox.style.animation = 'slideUpFade 0.4s ease'; 
      showToast('You must verify that the tools listed are correct');
      return;
    }
    
    // Complete registration
    state.transactionId = 'TXN-' + Date.now();
    state.timestamp = new Date().toISOString();
    
    const submitBtn = document.getElementById('btn-submit-booking');
    const originalText = submitBtn.innerText;
    
    if (state.apiUrl) {
      // Setup payload for Google Sheets
      submitBtn.innerText = "Syncing with Database...";
      submitBtn.disabled = true;
      
      const payload = {
        transactionId: state.transactionId,
        timestamp: state.timestamp,
        studentNumber: state.user.identifier,
        studentName: state.studentInfo.name,
        course: state.studentInfo.course,
        section: state.studentInfo.section,
        professor: state.studentInfo.instructor,
        subject: state.studentInfo.subject,
        cart: state.cart
      };

      fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(data => {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        
        if (data.status === 'success') {
          goToStep(4);
          renderReceipt();
          showToast('Booking generated and saved to Database!');
        } else {
          showToast('Saved locally, but Database Sync Failed: ' + data.message);
          goToStep(4);
          renderReceipt();
        }
      })
      .catch(error => {
        console.error("API Error:", error);
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        showToast('Saved locally. Database Sync Error (Check console or URL)');
        goToStep(4);
        renderReceipt();
      });
      
    } else {
      // Local only (No API URL set)
      goToStep(4);
      renderReceipt();
      showToast('Booking generated successfully (Local Only)!');
    }
  });

  // Scanner Modal Triggers
  const scannerModal = document.getElementById('scanner-modal');
  const btnOpenScanner = document.getElementById('btn-open-scanner');
  const btnCloseScanner = document.getElementById('btn-close-scanner');

  if (btnOpenScanner && scannerModal) {
    btnOpenScanner.addEventListener('click', () => {
      scannerModal.classList.add('open');
      // Focus barcode input for quick simulation
      setTimeout(() => {
        const barcodeInput = document.getElementById('barcode-mock-input');
        if (barcodeInput) barcodeInput.focus();
      }, 100);
    });
  }

  if (btnCloseScanner && scannerModal) {
    btnCloseScanner.addEventListener('click', () => {
      scannerModal.classList.remove('open');
    });
  }

  if (scannerModal) {
    scannerModal.addEventListener('click', (e) => {
      if (e.target === scannerModal) {
        scannerModal.classList.remove('open');
      }
    });
  }

  // Search Input Filter
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderToolsGrid();
  });

  // Category Pills Filters
  const catBtns = document.querySelectorAll('.category-pill-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      catBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.activeCategoryFilter = e.target.dataset.category;
      renderToolsGrid();
    });
  });

  // Scan Code Manual Simulation Input Form
  document.getElementById('barcode-submit-btn').addEventListener('click', () => {
    const input = document.getElementById('barcode-mock-input');
    const barcode = input.value.trim();
    if (barcode) {
      simulateBarcodeScan(barcode);
      input.value = '';
    } else {
      showToast('Please type a barcode to scan');
    }
  });

  // Verification Checkbox Toggle Design Update
  const checkbox = document.getElementById('verify-list-checkbox');
  const vBox = document.getElementById('verification-box');
  const vLabel = document.getElementById('verification-label');
  
  checkbox.addEventListener('change', (e) => {
    state.isVerified = e.target.checked;
    if (state.isVerified) {
      vBox.classList.remove('error-state');
      vBox.classList.add('verified-state');
      vLabel.classList.add('verified');
    } else {
      vBox.classList.remove('verified-state');
      vLabel.classList.remove('verified');
    }
    updateDeveloperPayload();
  });

  // Clear Cart Button
  document.getElementById('cart-clear-btn').addEventListener('click', () => {
    state.cart = [];
    checkbox.checked = false;
    state.isVerified = false;
    vBox.classList.remove('verified-state');
    vLabel.classList.remove('verified');
    updateCartUI();
    showToast('Cart cleared');
  });

  // Developer Preview Drawer Trigger
  document.getElementById('drawer-toggle-btn').addEventListener('click', () => {
    document.getElementById('developer-drawer').classList.add('open');
  });

  document.getElementById('drawer-close-btn').addEventListener('click', () => {
    document.getElementById('developer-drawer').classList.remove('open');
  });

  document.getElementById('copy-payload-btn').addEventListener('click', () => {
    const code = document.getElementById('payload-code-block').innerText;
    navigator.clipboard.writeText(code)
      .then(() => showToast('Payload copied to clipboard'))
      .catch(() => showToast('Failed to copy payload'));
  });

  // Step 4 Receipt Reset / Back to start
  document.getElementById('btn-receipt-done').addEventListener('click', () => {
    resetBorrowingSession();
    goToStep(1);
    showToast('Session reset for next borrower');
  });

  // Settings Modal Open/Close & Controls
  const settingsModal = document.getElementById('settings-modal');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  
  if (btnOpenSettings && settingsModal) {
    btnOpenSettings.addEventListener('click', () => {
      openSettingsModal();
    });
  }

  if (btnCloseSettings && settingsModal) {
    btnCloseSettings.addEventListener('click', () => {
      closeSettingsModal();
    });
  }

  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeSettingsModal();
      }
    });
  }

  // Settings Sync Form Submit
  const syncForm = document.getElementById('settings-sync-form');
  if (syncForm) {
    syncForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const sheetId = document.getElementById('setting-spreadsheet-id').value.trim();
      const tabName = document.getElementById('setting-tab-name').value.trim() || 'Inventory';
      const apiUrl = document.getElementById('setting-api-url').value.trim();
      
      state.apiUrl = apiUrl;
      localStorage.setItem('inventory_api_url', apiUrl);
      
      syncGoogleSheet(sheetId, tabName, false)
        .then(() => {
          setTimeout(() => {
            closeSettingsModal();
          }, 600);
        });
    });
  }

  // Load Demo Sheet button click
  const demoBtn = document.getElementById('btn-settings-demo');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      const idInput = document.getElementById('setting-spreadsheet-id');
      const tabInput = document.getElementById('setting-tab-name');
      if (idInput) idInput.value = 'DEMO_SHEET_ID_SIMULATED';
      if (tabInput) tabInput.value = 'Inventory';
      
      syncGoogleSheet('DEMO_SHEET_ID_SIMULATED', 'Inventory', false)
        .then(() => {
          setTimeout(() => {
            closeSettingsModal();
          }, 600);
        });
    });
  }

  // Disconnect button click
  const disconnectBtn = document.getElementById('btn-settings-disconnect');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      disconnectGoogleSheet();
    });
  }

  // User Profile Dropdown Menu in Dashboard
  const userMenuBtn = document.getElementById('dashboard-user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown-menu');
  
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }

  const ddEdit = document.getElementById('dropdown-edit-details');
  const ddSync = document.getElementById('dropdown-sync');
  const ddApi = document.getElementById('dropdown-api');
  const ddLogout = document.getElementById('dropdown-logout');

  if (ddEdit) ddEdit.addEventListener('click', () => { openEditDetailsFlow(); userDropdown.classList.remove('show'); });
  if (ddSync) ddSync.addEventListener('click', () => { openSettingsModal(); userDropdown.classList.remove('show'); });
  if (ddApi) ddApi.addEventListener('click', () => { document.getElementById('developer-drawer').classList.add('open'); userDropdown.classList.remove('show'); });
  if (ddLogout) ddLogout.addEventListener('click', () => { performLogout(); userDropdown.classList.remove('show'); });
}

// Router Navigation
function goToStep(stepNumber) {
  // Reset window scroll offset to resolve iOS viewport/bottom nav cutoff issues
  window.scrollTo(0, 0);

  state.currentStep = stepNumber;
  
  // Hide all cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => card.classList.remove('active'));
  
  // Show active card
  const activeCard = document.getElementById(`step${stepNumber}-card`);
  if (activeCard) {
    activeCard.classList.add('active');
  }
  
  if (stepNumber === 3) {
    document.body.classList.add('dashboard-mode');
    
    const userNameEl = document.getElementById('dashboard-user-name');
    if (userNameEl) {
      userNameEl.innerText = state.studentInfo.name || state.user.identifier || 'User';
    }
    
    // Update sidebar profile
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarCourse = document.getElementById('sidebar-user-course');
    if (sidebarName) sidebarName.innerText = state.studentInfo.name || state.user.identifier || 'Borrower Name';
    if (sidebarCourse) {
      sidebarCourse.innerText = formatSidebarCourseSummary(state.studentInfo.course, state.studentInfo.section);
    }
    
    // Set default mobile view to catalog
    if (activeCard) {
      activeCard.classList.add('mobile-view-catalog');
      activeCard.classList.remove('mobile-view-cart');
      const navCatBtn = document.getElementById('nav-catalog-btn');
      const navCrtBtn = document.getElementById('nav-cart-btn');
      if (navCatBtn) navCatBtn.classList.add('active');
      if (navCrtBtn) navCrtBtn.classList.remove('active');
    }
  } else {
    document.body.classList.remove('dashboard-mode');
  }
  
  updateStepUI();
  updateDeveloperPayload();
  // Show mobile header hamburger only in dashboard mode or for admins
  const mobileHamburger = document.getElementById('nav-hamburger-right') || document.getElementById('nav-settings-btn');
  if (mobileHamburger) {
    if (stepNumber === 3 || state.isAdmin) {
      mobileHamburger.style.display = 'flex';
    } else {
      mobileHamburger.style.display = 'none';
    }
  }
}

// Stepper bar logic
function updateStepUI() {
  // Stepper indicator has been removed to match a cleaner Apple design.
}

// Render Option B Manual list
function renderToolsGrid() {
  const container = document.getElementById('tools-grid');
  if (!container) return;
  
  container.innerHTML = '';
  
  const filteredTools = state.tools.filter(tool => {
    const matchesCategory = state.activeCategoryFilter === 'all' || 
      tool.category.toLowerCase() === state.activeCategoryFilter.toLowerCase();
    
    const matchesSearch = tool.name.toLowerCase().includes(state.searchQuery) ||
      tool.id.toLowerCase().includes(state.searchQuery) ||
      tool.category.toLowerCase().includes(state.searchQuery);
      
    return matchesCategory && matchesSearch;
  });

  if (filteredTools.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-secondary); font-size: 13px;">
        No tools match your filter or search query.
      </div>
    `;
    return;
  }

  filteredTools.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.innerHTML = `
      <div class="tool-card-info">
        <div class="tool-card-name">${tool.name}</div>
        <div class="tool-card-spec">${tool.specs || tool.description}</div>
      </div>
      <div class="tool-card-add-icon">+</div>
    `;
    card.addEventListener('click', () => {
      addToolToCart(tool);
    });
    container.appendChild(card);
  });
}

// Render simulation pills for scanner
function renderSimulatorPills() {
  const container = document.getElementById('sim-pills-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.tools.forEach(tool => {
    const pill = document.createElement('button');
    pill.className = 'sim-pill';
    pill.innerHTML = `${tool.name} (${tool.barcode})`;
    pill.addEventListener('click', () => {
      simulateBarcodeScan(tool.barcode);
    });
    container.appendChild(pill);
  });
}

// Simulation of Scan logic
function simulateBarcodeScan(barcode) {
  const viewfinder = document.getElementById('scan-viewfinder-overlay');
  const brackets = document.getElementById('target-brackets');
  const laser = document.getElementById('laser-line');
  
  // Find tool
  const tool = state.tools.find(t => t.barcode === barcode);
  
  if (!tool) {
    showToast('Unknown Barcode: ' + barcode);
    return;
  }

  // Animation triggers
  brackets.className = 'target-brackets success-scan';
  laser.className = 'laser-line success-scan';
  
  // Trigger screen flash (green tint)
  const flash = document.getElementById('beep-flash');
  if (flash) {
    flash.classList.add('flash');
  }

  // Sound generator
  playBeepSynth();

  setTimeout(() => {
    brackets.className = 'target-brackets scanning';
    laser.className = 'laser-line';
    if (flash) {
      flash.classList.remove('flash');
    }
    
    // Add to cart
    addToolToCart(tool);
    showToast(`Scanned: ${tool.name}`);
  }, 350);
}

// Play synthesizer scan beep sound using Web Audio API
function playBeepSynth() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1200Hz high pitch scan sound
    
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (err) {
    console.log('Web Audio API not supported/blocked', err);
  }
}

// Cart State Logic
function addToolToCart(tool) {
  const existingItem = state.cart.find(item => item.tool.id === tool.id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({
      tool: tool,
      quantity: 1
    });
  }
  
  updateCartUI();
}

function removeToolFromCart(toolId) {
  state.cart = state.cart.filter(item => item.tool.id !== toolId);
  if (state.cart.length === 0) {
    // Reset verification if list is empty
    document.getElementById('verify-list-checkbox').checked = false;
    state.isVerified = false;
    document.getElementById('verification-box').classList.remove('verified-state', 'error-state');
    document.getElementById('verification-label').classList.remove('verified');
  }
  updateCartUI();
}

function updateQuantity(toolId, change) {
  const item = state.cart.find(i => i.tool.id === toolId);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeToolFromCart(toolId);
    } else {
      updateCartUI();
    }
  }
}

function updateCartUI() {
  const container = document.getElementById('cart-items');
  const countBadge = document.getElementById('cart-count');
  
  if (!container || !countBadge) return;
  
  container.innerHTML = '';
  
  let totalItems = 0;
  
  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-view">
        <div class="empty-cart-text">No tools selected yet.<br>Choose from catalog or scan tools.</div>
      </div>
    `;
    countBadge.innerText = '0';
    updateDeveloperPayload();
    return;
  }

  state.cart.forEach(item => {
    totalItems += item.quantity;
    
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-details">
        <div class="cart-item-name">${item.tool.name}</div>
        <div class="cart-item-category">${item.tool.category}</div>
      </div>
      <div class="cart-item-actions">
        <button class="qty-btn" onclick="updateQuantity('${item.tool.id}', -1)">-</button>
        <span class="qty-val">${item.quantity}</span>
        <button class="qty-btn" onclick="updateQuantity('${item.tool.id}', 1)">+</button>
        <button class="cart-item-remove-btn" onclick="removeToolFromCart('${item.tool.id}')">✕</button>
      </div>
    `;
    container.appendChild(div);
  });
  
  countBadge.innerText = totalItems;
  
  const navCountBadge = document.getElementById('nav-cart-count');
  if (navCountBadge) {
    navCountBadge.innerText = totalItems;
    if (totalItems > 0) {
      navCountBadge.style.display = 'flex';
    } else {
      navCountBadge.style.display = 'none';
    }
  }
  
  updateDeveloperPayload();
}

// Global accessor wrappers for inline onclick functions
window.updateQuantity = updateQuantity;
window.removeToolFromCart = removeToolFromCart;

// Toast Utility
function showToast(message) {
  const container = document.getElementById('toast-notification');
  const textEl = document.getElementById('toast-text');
  
  if (!container || !textEl) return;
  
  textEl.innerText = message;
  container.classList.add('show');
  
  // Clear any existing timeout
  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }
  
  window.toastTimeout = setTimeout(() => {
    container.classList.remove('show');
  }, 2800);
}

// Update JSON Preview Object for Google Sheets Integration
function updateDeveloperPayload() {
  const payloadBox = document.getElementById('payload-code-block');
  if (!payloadBox) return;
  
  let parsedYear = "";
  let parsedSectionOnly = "";
  if (state.studentInfo.section) {
    const parts = state.studentInfo.section.split(' ');
    if (parts.length > 1) {
      const numbers = parts[1].split('-');
      if (numbers.length > 1) {
        parsedSectionOnly = numbers[0];
        parsedYear = numbers[1];
      }
    }
  }

  const payload = {
    sheetsAction: "APPEND_ROW",
    targetDatabase: "Google Sheets API V4",
    spreadsheetName: "Tool_Inventory_Database",
    sheetName: "Log_Transactions",
    data: {
      transactionId: state.transactionId || "PENDING_CONFIRMATION",
      timestamp: state.timestamp || new Date().toISOString(),
      studentNumber: state.user.authMethod === 'password' ? state.user.identifier : "",
      studentEmail: state.user.authMethod === 'google' ? state.user.identifier : "",
      authMethod: state.user.authMethod || "password",
      borrowerName: state.studentInfo.name || "",
      studentCourse: state.studentInfo.course || "",
      studentSection: state.studentInfo.section || "",
      parsedYear: parsedYear,
      parsedSectionOnly: parsedSectionOnly,
      instructor: state.studentInfo.instructor || "",
      subject: state.studentInfo.subject || "",
      isVerifiedCorrect: state.isVerified,
      itemsBorrowed: state.cart.map(item => ({
        toolId: item.tool.id,
        name: item.tool.name,
        category: item.tool.category,
        barcode: item.tool.barcode,
        quantity: item.quantity
      }))
    }
  };
  
  payloadBox.innerText = JSON.stringify(payload, null, 2);
}

// Render Receipt screen
function renderReceipt() {
  const dateEl = document.getElementById('receipt-date');
  const txnEl = document.getElementById('receipt-txn');
  const nameEl = document.getElementById('receipt-name');
  const authLabelEl = document.getElementById('receipt-auth-label');
  const authValEl = document.getElementById('receipt-student-number');
  const courseEl = document.getElementById('receipt-course');
  const instructorEl = document.getElementById('receipt-instructor');
  const subjectEl = document.getElementById('receipt-subject');
  const toolsListEl = document.getElementById('receipt-tools-list');
  const barcodeTextEl = document.getElementById('receipt-barcode-text');
  
  // Format Date
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const formattedDate = new Date(state.timestamp).toLocaleDateString('en-US', options);
  
  if (dateEl) dateEl.innerText = formattedDate;
  if (txnEl) txnEl.innerText = state.transactionId;
  if (nameEl) nameEl.innerText = state.studentInfo.name;
  
  if (authLabelEl && authValEl) {
    if (state.user.authMethod === 'google') {
      authLabelEl.innerText = 'EMAIL';
      authValEl.innerText = state.user.identifier;
    } else {
      authLabelEl.innerText = 'STUDENT NUMBER';
      authValEl.innerText = state.user.identifier;
    }
  }
  
  if (courseEl) courseEl.innerText = state.studentInfo.course;
  const sectionEl = document.getElementById('receipt-section');
  if (sectionEl) {
    sectionEl.innerText = state.studentInfo.section;
  }
  if (instructorEl) instructorEl.innerText = state.studentInfo.instructor;
  if (subjectEl) subjectEl.innerText = state.studentInfo.subject;
  if (barcodeTextEl) barcodeTextEl.innerText = state.transactionId;
  
  if (toolsListEl) {
    toolsListEl.innerHTML = '';
    state.cart.forEach(item => {
      const li = document.createElement('div');
      li.className = 'receipt-tool-item';
      li.innerHTML = `
        <span class="receipt-tool-name">${item.tool.name}</span>
        <span class="receipt-tool-qty">x${item.quantity}</span>
      `;
      toolsListEl.appendChild(li);
    });
  }
}

// Look up user profile — mock credentials or Google Sheets API
function lookupUserProfile(studentNumber, password) {
  const submitBtn = document.getElementById('auth-submit-btn');
  const originalBtnText = submitBtn.innerText;

  // --- Mock credentials for testing ---
  if (studentNumber === '2023-12345-MN-0' && password === '12345') {
    state.studentInfo = {
      name: 'Bong Bong Marcos',
      course: 'Diploma in Mechanical Engineering Technology (DMET)',
      section: 'DMET 2-3',
      instructor: 'Engr. Restie',
      subject: 'DMET Workshop'
    };
    goToStep(3);
    showToast('Welcome back, Bong Bong Marcos!');
    return;
  }

  // --- If API URL is set, try to look up the user from the Google Sheet ---
  if (state.apiUrl) {
    submitBtn.innerText = 'Looking up account...';
    submitBtn.disabled = true;

    const lookupUrl = state.apiUrl + '?action=lookup&studentId=' + encodeURIComponent(studentNumber);

    fetch(lookupUrl)
      .then(response => response.json())
      .then(data => {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;

        if (data.status === 'found' && data.user) {
          // User exists — populate state and skip Step 2
          state.studentInfo = {
            name: data.user.name || '',
            course: data.user.course || '',
            section: data.user.section || '',
            instructor: data.user.instructor || '',
            subject: data.user.subject || ''
          };
          goToStep(3);
          showToast(`Welcome back, ${state.studentInfo.name || 'User'}!`);
        } else {
          // User not found — go to Step 2 to register details
          goToStep(2);
          if (state.isSignUpMode) {
            showToast('Account created — please fill in your details');
          } else {
            showToast('First-time login — please fill in your details');
          }
        }
      })
      .catch(error => {
        console.error('User lookup failed:', error);
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
        // Fallback to Step 2
        goToStep(2);
        showToast('Could not verify account. Please fill in your details.');
      });
  } else {
    // No API URL set — always go to Step 2
    goToStep(2);
    if (state.isSignUpMode) {
      showToast('Account created successfully');
    } else {
      showToast('Login successful');
    }
  }
}

// Reset session state
function resetBorrowingSession() {
  state.cart = [];
  state.isVerified = false;
  state.transactionId = '';
  state.timestamp = '';
  state.isSignUpMode = false;
  state.user = { identifier: '', password: '', authMethod: 'password' };
  
  // Clear inputs
  document.getElementById('student-number').value = '';
  document.getElementById('password').value = '';
  const confirmStudent = document.getElementById('confirm-student-number');
  const confirmPass = document.getElementById('confirm-password');
  if (confirmStudent) confirmStudent.value = '';
  if (confirmPass) confirmPass.value = '';
  
  document.getElementById('student-name').value = '';
  document.getElementById('student-course').selectedIndex = 0;
  updateSectionOptions();
  document.getElementById('student-instructor').value = '';
  document.getElementById('student-subject').value = '';
  
  // Clear checkbox
  const checkbox = document.getElementById('verify-list-checkbox');
  checkbox.checked = false;
  
  const vBox = document.getElementById('verification-box');
  const vLabel = document.getElementById('verification-label');
  vBox.classList.remove('verified-state', 'error-state');
  vLabel.classList.remove('verified');
  
  updateCartUI();
  updateAuthUI();
}

function updateAuthUI() {
  const titleEl = document.getElementById('auth-title');
  const descEl = document.getElementById('auth-desc');
  const submitBtn = document.getElementById('auth-submit-btn');
  const toggleAuthBtn = document.getElementById('toggle-auth-mode-btn');
  const googleBtnText = document.getElementById('google-auth-btn-text');
  
  if (!titleEl || !descEl || !submitBtn || !toggleAuthBtn) return;
  
  // Clear primary input fields when toggling
  const studentNumInput = document.getElementById('student-number');
  const passInput = document.getElementById('password');
  if (studentNumInput) studentNumInput.value = '';
  if (passInput) passInput.value = '';
  
  // Toggle visibility of signup-only input fields
  const signupOnlyFields = document.querySelectorAll('.signup-only');
  signupOnlyFields.forEach(field => {
    field.style.display = state.isSignUpMode ? 'block' : 'none';
  });
  
  // Toggle visibility of the back to signin button container
  const step1Nav = document.getElementById('step1-nav');
  if (step1Nav) {
    step1Nav.style.display = state.isSignUpMode ? 'flex' : 'none';
  }
  
  // Toggle validation check constraints for signup verification fields
  const confirmStudentInput = document.getElementById('confirm-student-number');
  const confirmPassInput = document.getElementById('confirm-password');
  if (confirmStudentInput) {
    confirmStudentInput.required = state.isSignUpMode;
    confirmStudentInput.value = '';
  }
  if (confirmPassInput) {
    confirmPassInput.required = state.isSignUpMode;
    confirmPassInput.value = '';
  }
  
  if (state.isSignUpMode) {
    titleEl.innerText = "Create your Tool Inventory Account";
    descEl.innerText = "Sign up with your student number to start borrowing equipment.";
    submitBtn.innerText = "Create Account";
    toggleAuthBtn.innerText = "Already have an account? Sign in";
    if (googleBtnText) googleBtnText.innerText = "Sign up with Google";
  } else {
    titleEl.innerText = "Sign in to Tool Inventory";
    descEl.innerText = "Enter your student number and password to proceed.";
    submitBtn.innerText = "Continue with Password";
    toggleAuthBtn.innerText = "Don't have an account? Sign up";
    if (googleBtnText) googleBtnText.innerText = "Sign in with Google";
  }
}

// Simulated Google Sign-In function
function handleGoogleSignIn() {
  state.user.identifier = 'simulated.student@gmail.com';
  state.user.password = 'google-oauth-simulated';
  state.user.authMethod = 'google';
  goToStep(2);
  showToast('Logged in via Google Account');
}

// Expose Google sign in to global scope for onclick handler
window.handleGoogleSignIn = handleGoogleSignIn;

// Dynamic Section & Year selection options generator
function updateSectionOptions() {
  const courseSelect = document.getElementById('student-course');
  const sectionSelect = document.getElementById('student-section');
  if (!courseSelect || !sectionSelect) return;
  
  const courseVal = courseSelect.value;
  sectionSelect.innerHTML = '';
  
  if (!courseVal) {
    sectionSelect.disabled = true;
    const opt = document.createElement('option');
    opt.value = '';
    opt.disabled = true;
    opt.selected = true;
    opt.innerText = 'Select course first...';
    sectionSelect.appendChild(opt);
    return;
  }
  
  sectionSelect.disabled = false;
  const placeholderOpt = document.createElement('option');
  placeholderOpt.value = '';
  placeholderOpt.disabled = true;
  placeholderOpt.selected = true;
  placeholderOpt.innerText = 'Select section & year...';
  sectionSelect.appendChild(placeholderOpt);
  
  const abbrevMatch = courseVal.match(/\(([^)]+)\)/);
  const abbrev = abbrevMatch ? abbrevMatch[1] : '';
  
  // Format options: [Abbrev] [Section]-[Year]
  // Loop from Section 1 to 3, Year 1 to 3
  for (let s = 1; s <= 3; s++) {
    for (let y = 1; y <= 3; y++) {
      const optVal = `${abbrev} ${s}-${y}`;
      const opt = document.createElement('option');
      opt.value = optVal;
      opt.innerText = optVal;
      sectionSelect.appendChild(opt);
    }
  }
}

// RFC 4180 CSV Parser
function parseCSV(csvText) {
  const result = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // skip next char
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip next char
      }
      result.push(row);
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }
  
  if (row.length > 1 || row[0] !== '') {
    result.push(row);
  }

  return result.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

// Sync Google Sheet Inventory Database
function syncGoogleSheet(sheetId, tabName, isSilent = false) {
  if (!sheetId) {
    if (!isSilent) showToast('Please enter a Spreadsheet ID');
    return Promise.reject('No Spreadsheet ID');
  }

  const cleanSheetId = sheetId.trim();
  const cleanTabName = (tabName || 'Inventory').trim();
  
  if (!isSilent) {
    updateSyncStatusUI('syncing', 'Syncing with Google Sheets...');
  }

  let fetchPromise;
  if (cleanSheetId === 'DEMO_SHEET_ID_SIMULATED') {
    // Generate simulated CSV text from LOCAL_TOOLS_DATABASE
    const csvHeaders = 'id,name,barcode,category,icon,description,specs';
    const csvRows = LOCAL_TOOLS_DATABASE.map(t => 
      `"${t.id}","${t.name}","${t.barcode}","${t.category}","${t.icon}","${t.description}","${t.specs}"`
    );
    const mockCsvText = [csvHeaders, ...csvRows].join('\n');
    fetchPromise = new Promise((resolve) => setTimeout(() => resolve(mockCsvText), 600));
  } else {
    const url = `https://docs.google.com/spreadsheets/d/${cleanSheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(cleanTabName)}`;
    fetchPromise = fetch(url).then(response => {
      if (!response.ok) throw new Error('Failed to fetch spreadsheet. Verify ID and internet connection.');
      return response.text();
    });
  }

  return fetchPromise
    .then(csvText => {
      const rows = parseCSV(csvText);
      if (rows.length < 2) {
        throw new Error('Spreadsheet appears to be empty or has no header row.');
      }

      // Map rows
      const headers = rows[0].map(h => h.trim().toLowerCase());
      
      const idIdx = headers.findIndex(h => h === 'id' || h === 'tool id' || h === 'tool_id');
      const nameIdx = headers.findIndex(h => h === 'name' || h === 'tool name' || h === 'tool_name' || h === 'title');
      const barcodeIdx = headers.findIndex(h => h === 'barcode' || h === 'barcode number' || h === 'code');
      const categoryIdx = headers.findIndex(h => h === 'category' || h === 'tool category');
      const iconIdx = headers.findIndex(h => h === 'icon' || h === 'emoji' || h === 'tool icon');
      const descIdx = headers.findIndex(h => h === 'description' || h === 'info' || h === 'details');
      const specsIdx = headers.findIndex(h => h === 'specs' || h === 'specification' || h === 'specifications');

      if (idIdx === -1 || nameIdx === -1 || barcodeIdx === -1 || categoryIdx === -1) {
        throw new Error('Missing required headers: id, name, barcode, and category are mandatory.');
      }

      const getCell = (row, idx) => (idx !== -1 && row[idx] !== undefined) ? row[idx].trim() : '';

      const parsedTools = [];
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const idVal = getCell(row, idIdx);
        const nameVal = getCell(row, nameIdx);
        const barcodeVal = getCell(row, barcodeIdx);
        const categoryVal = getCell(row, categoryIdx);

        if (!idVal || !nameVal || !barcodeVal) continue;

        parsedTools.push({
          id: idVal,
          name: nameVal,
          barcode: barcodeVal,
          category: categoryVal || 'General',
          icon: getCell(row, iconIdx) || '🔧',
          description: getCell(row, descIdx),
          specs: getCell(row, specsIdx)
        });
      }

      if (parsedTools.length === 0) {
        throw new Error('No valid tools rows were found. Make sure data is filled.');
      }

      // Sync state and persistence
      state.tools = parsedTools;
      state.sheetId = cleanSheetId;
      state.sheetTab = cleanTabName;
      state.isSynced = true;

      localStorage.setItem('inventory_sheet_id', cleanSheetId);
      localStorage.setItem('inventory_sheet_tab', cleanTabName);
      localStorage.setItem('inventory_is_synced', 'true');
      localStorage.setItem('cached_sheet_tools', JSON.stringify(parsedTools));

      // Re-initialize views
      initializeUI();
      
      updateSyncStatusUI('synced', `Live Synced: ${parsedTools.length} tools loaded.`);
      if (!isSilent) {
        showToast(`Synced! Loaded ${parsedTools.length} tools from Google Sheets.`);
      }
    })
    .catch(error => {
      console.error('Google Sheet sync failed:', error);
      updateSyncStatusUI('error', `Sync failed: ${error.message || error}`);
      if (!isSilent) {
        showToast(`Sync Failed: ${error.message || 'Check ID and sharing permissions.'}`);
      }
      
      // Fallback: if we were previously synced, keep cache. If not, fallback to local/mock tools.
      if (!state.tools || state.tools.length === 0) {
        state.tools = LOCAL_TOOLS_DATABASE;
        initializeUI();
      }
      throw error;
    });
}

// Update Sync Status UI Panel
function updateSyncStatusUI(status, message) {
  const box = document.getElementById('sync-status-box');
  const title = document.getElementById('sync-status-title');
  const desc = document.getElementById('sync-status-desc');
  const disconnectBtn = document.getElementById('btn-settings-disconnect');
  
  if (!box || !title || !desc) return;
  
  box.className = 'sync-status-box'; // reset classes
  if (disconnectBtn) disconnectBtn.style.display = 'none';

  if (status === 'synced') {
    box.classList.add('success-mode');
    title.innerText = 'Google Sheet Connected';
    desc.innerText = message || 'Your spreadsheet inventory database is synced successfully.';
    if (disconnectBtn) disconnectBtn.style.display = 'block';
  } else if (status === 'error') {
    box.classList.add('error-mode');
    title.innerText = 'Sync Connection Error';
    desc.innerText = message || 'Could not fetch. Verify Sheet is shared and ID is correct.';
    if (disconnectBtn) disconnectBtn.style.display = 'block';
  } else if (status === 'syncing') {
    box.classList.add('info-mode');
    title.innerText = 'Syncing...';
    desc.innerText = message || 'Connecting to Google Sheets and fetching tool catalog.';
  } else {
    // Mock Mode
    box.classList.add('info-mode');
    title.innerText = 'Mock Database Mode';
    desc.innerText = message || 'Using offline simulated tool database. Connect a Google Sheet to fetch live tools.';
  }
}

// Populate Settings Inputs from state
function populateSettingsInputs() {
  const idInput = document.getElementById('setting-spreadsheet-id');
  const tabInput = document.getElementById('setting-tab-name');
  const apiUrlInput = document.getElementById('setting-api-url');
  
  if (idInput) idInput.value = state.sheetId;
  if (tabInput) tabInput.value = state.sheetTab || 'Inventory';
  if (apiUrlInput) apiUrlInput.value = state.apiUrl || '';
  
  if (state.isSynced && state.sheetId) {
    const cachedCount = state.tools ? state.tools.length : 0;
    updateSyncStatusUI('synced', `Live Synced: ${cachedCount} tools loaded.`);
  } else {
    updateSyncStatusUI('mock');
  }
}

// Apply admin-only UI toggles based on URL flag
function applyAdminUI() {
  const isAdmin = !!state.isAdmin;
  const drawerToggleBtn = document.getElementById('drawer-toggle-btn');
  const settingsJsonBtn = document.getElementById('settings-action-json');

  if (drawerToggleBtn) drawerToggleBtn.style.display = isAdmin ? 'block' : 'none';
  if (settingsJsonBtn) settingsJsonBtn.style.display = isAdmin ? 'inline-flex' : 'none';

  const devOnlyEls = document.querySelectorAll('.dev-only');
  devOnlyEls.forEach(el => {
    el.style.display = isAdmin ? (el.tagName === 'BUTTON' && el.classList.contains('sidebar-nav-item') ? 'flex' : 'block') : 'none';
  });

  // Ensure developer drawer is closed for normal users
  if (!isAdmin) {
    const devDrawer = document.getElementById('developer-drawer');
    if (devDrawer) devDrawer.classList.remove('open');
  }
}

// Disconnect Google Sheet integration
function disconnectGoogleSheet() {
  state.isSynced = false;
  state.sheetId = '';
  state.sheetTab = 'Inventory';
  
  localStorage.removeItem('inventory_sheet_id');
  localStorage.removeItem('inventory_sheet_tab');
  localStorage.setItem('inventory_is_synced', 'false');
  localStorage.removeItem('cached_sheet_tools');
  localStorage.removeItem('inventory_api_url');
  
  // Clear inputs
  const idInput = document.getElementById('setting-spreadsheet-id');
  const tabInput = document.getElementById('setting-tab-name');
  const apiUrlInput = document.getElementById('setting-api-url');
  if (idInput) idInput.value = '';
  if (tabInput) tabInput.value = 'Inventory';
  if (apiUrlInput) apiUrlInput.value = '';
  
  updateSyncStatusUI('mock');
  
  // Reload mock DB
  loadToolsDatabase();
  showToast('Disconnected. Loaded simulated mock inventory database.');
}
