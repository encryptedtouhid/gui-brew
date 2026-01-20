// State management
const state = {
  currentView: 'installed',
  installedPackages: { formulae: [], casks: [], all: [] },
  currentFilter: 'all',
  currentPackage: null,
  isLoading: false
};

// DOM Elements
const elements = {
  viewTitle: document.getElementById('view-title'),
  loadingIndicator: document.getElementById('loading-indicator'),
  brewVersion: document.getElementById('brew-version'),

  // Views
  views: {
    installed: document.getElementById('view-installed'),
    search: document.getElementById('view-search'),
    outdated: document.getElementById('view-outdated'),
    services: document.getElementById('view-services'),
    taps: document.getElementById('view-taps'),
    pinned: document.getElementById('view-pinned'),
    leaves: document.getElementById('view-leaves'),
    doctor: document.getElementById('view-doctor'),
    cleanup: document.getElementById('view-cleanup'),
    terminal: document.getElementById('view-terminal')
  },

  // Lists
  installedList: document.getElementById('installed-list'),
  searchResults: document.getElementById('search-results'),
  outdatedList: document.getElementById('outdated-list'),
  servicesList: document.getElementById('services-list'),
  tapsList: document.getElementById('taps-list'),
  pinnedList: document.getElementById('pinned-list'),
  leavesList: document.getElementById('leaves-list'),
  doctorOutput: document.getElementById('doctor-output'),
  cleanupOutput: document.getElementById('cleanup-output'),
  terminalHistory: document.getElementById('terminal-history'),

  // Inputs
  installedSearch: document.getElementById('installed-search'),
  searchInput: document.getElementById('search-input'),
  tapInput: document.getElementById('tap-input'),
  terminalInput: document.getElementById('terminal-input'),

  // Buttons
  btnUpdateBrew: document.getElementById('btn-update-brew'),
  searchBtn: document.getElementById('search-btn'),
  upgradeAllBtn: document.getElementById('upgrade-all-btn'),
  refreshOutdatedBtn: document.getElementById('refresh-outdated-btn'),
  refreshServicesBtn: document.getElementById('refresh-services-btn'),
  addTapBtn: document.getElementById('add-tap-btn'),
  refreshTapsBtn: document.getElementById('refresh-taps-btn'),
  refreshPinnedBtn: document.getElementById('refresh-pinned-btn'),
  refreshLeavesBtn: document.getElementById('refresh-leaves-btn'),
  autoremoveBtn: document.getElementById('autoremove-btn'),
  runDoctorBtn: document.getElementById('run-doctor-btn'),
  cleanupDryBtn: document.getElementById('cleanup-dry-btn'),
  cleanupBtn: document.getElementById('cleanup-btn'),
  terminalRunBtn: document.getElementById('terminal-run-btn'),

  // Modals
  packageModal: document.getElementById('package-modal'),
  confirmModal: document.getElementById('confirm-modal'),
  outputModal: document.getElementById('output-modal'),
  modalPackageName: document.getElementById('modal-package-name'),
  modalPackageInfo: document.getElementById('modal-package-info'),
  modalUninstallBtn: document.getElementById('modal-uninstall-btn'),
  modalDepsBtn: document.getElementById('modal-deps-btn'),
  modalUsesBtn: document.getElementById('modal-uses-btn'),
  modalPinBtn: document.getElementById('modal-pin-btn'),
  confirmTitle: document.getElementById('confirm-title'),
  confirmMessage: document.getElementById('confirm-message'),
  confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
  confirmOkBtn: document.getElementById('confirm-ok-btn'),
  outputTitle: document.getElementById('output-title'),
  outputContent: document.getElementById('output-content')
};

// Utility functions
function setLoading(loading, message = 'Loading...') {
  state.isLoading = loading;
  const indicator = elements.loadingIndicator;
  if (loading) {
    indicator.classList.remove('hidden');
    indicator.querySelector('span').textContent = message;
  } else {
    indicator.classList.add('hidden');
  }
}

function showView(viewName) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  // Update views
  Object.entries(elements.views).forEach(([name, el]) => {
    el.classList.toggle('active', name === viewName);
  });

  // Update title
  const titles = {
    installed: 'Installed Packages',
    search: 'Search Packages',
    outdated: 'Available Updates',
    services: 'Homebrew Services',
    taps: 'Taps',
    pinned: 'Pinned Packages',
    leaves: 'Leaf Packages',
    doctor: 'Homebrew Doctor',
    cleanup: 'Cleanup',
    terminal: 'Terminal'
  };
  elements.viewTitle.textContent = titles[viewName] || viewName;
  state.currentView = viewName;

  // Load view data
  loadViewData(viewName);
}

async function loadViewData(viewName) {
  switch (viewName) {
    case 'installed':
      await loadInstalledPackages();
      break;
    case 'outdated':
      await loadOutdatedPackages();
      break;
    case 'services':
      await loadServices();
      break;
    case 'taps':
      await loadTaps();
      break;
    case 'pinned':
      await loadPinned();
      break;
    case 'leaves':
      await loadLeaves();
      break;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Package rendering
function renderPackageItem(pkg, showActions = true, extraActions = []) {
  const iconClass = pkg.type === 'cask' ? 'cask' : 'formula';
  const icon = pkg.type === 'cask' ? '💿' : '📦';
  const badgeClass = pkg.type === 'cask' ? 'badge-cask' : 'badge-formula';

  let actionsHtml = '';
  if (showActions) {
    actionsHtml = `
      <div class="package-actions">
        ${extraActions.map(a => `<button class="btn btn-small ${a.class || 'btn-secondary'}" data-action="${a.action}" data-name="${pkg.name}" data-cask="${pkg.type === 'cask'}">${a.label}</button>`).join('')}
        <button class="btn btn-small btn-danger" data-action="uninstall" data-name="${pkg.name}" data-cask="${pkg.type === 'cask'}">Uninstall</button>
      </div>
    `;
  }

  return `
    <div class="package-item fade-in" data-name="${pkg.name}" data-type="${pkg.type}">
      <div class="package-icon ${iconClass}">${icon}</div>
      <div class="package-info-main">
        <div class="package-name">${escapeHtml(pkg.name)}</div>
        <span class="badge ${badgeClass}">${pkg.type}</span>
        ${pkg.info ? `<span class="text-muted" style="margin-left: 8px; font-size: 12px;">${escapeHtml(pkg.info)}</span>` : ''}
      </div>
      ${actionsHtml}
    </div>
  `;
}

// Installed packages
async function loadInstalledPackages() {
  setLoading(true, 'Loading packages...');
  try {
    const result = await window.brew.list('all');
    if (result.success) {
      state.installedPackages = result;
      filterAndRenderInstalled();
    } else {
      elements.installedList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(result.error || 'Failed to load packages')}</p></div>`;
    }
  } catch (error) {
    elements.installedList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(error.message)}</p></div>`;
  }
  setLoading(false);
}

function filterAndRenderInstalled() {
  const searchTerm = elements.installedSearch.value.toLowerCase();
  let packages = [];

  if (state.currentFilter === 'all') {
    packages = state.installedPackages.all;
  } else if (state.currentFilter === 'formulae') {
    packages = state.installedPackages.formulae;
  } else {
    packages = state.installedPackages.casks;
  }

  if (searchTerm) {
    packages = packages.filter(pkg => pkg.name.toLowerCase().includes(searchTerm));
  }

  if (packages.length === 0) {
    elements.installedList.innerHTML = `<div class="empty-state"><span class="empty-icon">📦</span><p>No packages found</p></div>`;
    return;
  }

  elements.installedList.innerHTML = packages.map(pkg => renderPackageItem(pkg)).join('');
}

// Search packages
async function searchPackages() {
  const query = elements.searchInput.value.trim();
  if (!query) return;

  setLoading(true, 'Searching...');
  try {
    const result = await window.brew.search(query);
    if (result.success) {
      const allResults = [...result.formulae, ...result.casks];
      if (allResults.length === 0) {
        elements.searchResults.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><p>No packages found for "${escapeHtml(query)}"</p></div>`;
      } else {
        elements.searchResults.innerHTML = allResults.map(pkg =>
          renderPackageItem(pkg, true, [{ action: 'install', label: 'Install', class: 'btn-success' }])
        ).join('');
      }
    } else {
      elements.searchResults.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(result.error)}</p></div>`;
    }
  } catch (error) {
    elements.searchResults.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(error.message)}</p></div>`;
  }
  setLoading(false);
}

// Outdated packages
async function loadOutdatedPackages() {
  setLoading(true, 'Checking for updates...');
  try {
    const result = await window.brew.outdated();
    if (result.success) {
      const allOutdated = result.all;
      if (allOutdated.length === 0) {
        elements.outdatedList.innerHTML = `<div class="empty-state"><span class="empty-icon">✅</span><p>All packages are up to date!</p></div>`;
      } else {
        elements.outdatedList.innerHTML = allOutdated.map(pkg =>
          renderPackageItem(pkg, true, [{ action: 'upgrade', label: 'Upgrade', class: 'btn-success' }])
        ).join('');
      }
    } else {
      elements.outdatedList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(result.error)}</p></div>`;
    }
  } catch (error) {
    elements.outdatedList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(error.message)}</p></div>`;
  }
  setLoading(false);
}

async function upgradeAll() {
  const confirmed = await showConfirm('Upgrade All', 'Are you sure you want to upgrade all outdated packages?');
  if (!confirmed) return;

  setLoading(true, 'Upgrading all packages...');
  try {
    const result = await window.brew.upgrade();
    showOutput('Upgrade Results', result.success ? result.output : result.error, result.success);
    if (result.success) {
      await loadOutdatedPackages();
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

// Services
async function loadServices() {
  setLoading(true, 'Loading services...');
  try {
    const result = await window.brew.services();
    if (result.success) {
      if (result.services.length === 0) {
        elements.servicesList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚙️</span><p>No services found</p></div>`;
      } else {
        elements.servicesList.innerHTML = result.services.map(svc => `
          <div class="service-item fade-in" data-name="${svc.name}">
            <div class="service-status ${svc.status === 'started' ? 'started' : svc.status === 'error' ? 'error' : 'stopped'}"></div>
            <div class="service-info">
              <div class="service-name">${escapeHtml(svc.name)}</div>
              <div class="service-user">${svc.status} ${svc.user ? `(${svc.user})` : ''}</div>
            </div>
            <div class="service-actions">
              ${svc.status === 'started' ?
                `<button class="btn btn-small btn-secondary" data-action="service-stop" data-name="${svc.name}">Stop</button>
                 <button class="btn btn-small btn-warning" data-action="service-restart" data-name="${svc.name}">Restart</button>` :
                `<button class="btn btn-small btn-success" data-action="service-start" data-name="${svc.name}">Start</button>`
              }
            </div>
          </div>
        `).join('');
      }
    } else {
      elements.servicesList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(result.error)}</p></div>`;
    }
  } catch (error) {
    elements.servicesList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(error.message)}</p></div>`;
  }
  setLoading(false);
}

// Taps
async function loadTaps() {
  setLoading(true, 'Loading taps...');
  try {
    const result = await window.brew.taps();
    if (result.success) {
      if (result.taps.length === 0) {
        elements.tapsList.innerHTML = `<div class="empty-state"><span class="empty-icon">🔌</span><p>No additional taps installed</p></div>`;
      } else {
        elements.tapsList.innerHTML = result.taps.map(tap => `
          <div class="tap-item fade-in" data-name="${tap}">
            <span class="tap-icon">🔌</span>
            <span class="tap-name">${escapeHtml(tap)}</span>
            <button class="btn btn-small btn-danger" data-action="tap-remove" data-name="${tap}">Remove</button>
          </div>
        `).join('');
      }
    } else {
      elements.tapsList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(result.error)}</p></div>`;
    }
  } catch (error) {
    elements.tapsList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(error.message)}</p></div>`;
  }
  setLoading(false);
}

async function addTap() {
  const name = elements.tapInput.value.trim();
  if (!name) return;

  setLoading(true, 'Adding tap...');
  try {
    const result = await window.brew.tapAdd(name);
    if (result.success) {
      elements.tapInput.value = '';
      await loadTaps();
    } else {
      showOutput('Error', result.error, false);
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

// Pinned
async function loadPinned() {
  setLoading(true, 'Loading pinned packages...');
  try {
    const result = await window.brew.pinned();
    if (result.success) {
      if (result.pinned.length === 0) {
        elements.pinnedList.innerHTML = `<div class="empty-state"><span class="empty-icon">📌</span><p>No pinned packages</p></div>`;
      } else {
        elements.pinnedList.innerHTML = result.pinned.map(name => `
          <div class="package-item fade-in" data-name="${name}">
            <div class="package-icon formula">📌</div>
            <div class="package-info-main">
              <div class="package-name">${escapeHtml(name)}</div>
              <span class="badge badge-formula">pinned</span>
            </div>
            <div class="package-actions">
              <button class="btn btn-small btn-secondary" data-action="unpin" data-name="${name}">Unpin</button>
            </div>
          </div>
        `).join('');
      }
    } else {
      elements.pinnedList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(result.error)}</p></div>`;
    }
  } catch (error) {
    elements.pinnedList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(error.message)}</p></div>`;
  }
  setLoading(false);
}

// Leaves
async function loadLeaves() {
  setLoading(true, 'Loading leaf packages...');
  try {
    const result = await window.brew.leaves();
    if (result.success) {
      if (result.leaves.length === 0) {
        elements.leavesList.innerHTML = `<div class="empty-state"><span class="empty-icon">🍃</span><p>No leaf packages found</p></div>`;
      } else {
        elements.leavesList.innerHTML = result.leaves.map(name => `
          <div class="package-item fade-in" data-name="${name}">
            <div class="package-icon formula">🍃</div>
            <div class="package-info-main">
              <div class="package-name">${escapeHtml(name)}</div>
              <span class="text-muted" style="font-size: 12px;">Not required by other packages</span>
            </div>
            <div class="package-actions">
              <button class="btn btn-small btn-danger" data-action="uninstall" data-name="${name}" data-cask="false">Uninstall</button>
            </div>
          </div>
        `).join('');
      }
    } else {
      elements.leavesList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(result.error)}</p></div>`;
    }
  } catch (error) {
    elements.leavesList.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${escapeHtml(error.message)}</p></div>`;
  }
  setLoading(false);
}

async function autoremove() {
  const confirmed = await showConfirm('Autoremove', 'Remove all unused dependencies?');
  if (!confirmed) return;

  setLoading(true, 'Removing unused dependencies...');
  try {
    const result = await window.brew.autoremove();
    showOutput('Autoremove Results', result.success ? (result.output || 'No unused dependencies to remove.') : result.error, result.success);
    if (result.success) {
      await loadLeaves();
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

// Doctor
async function runDoctor() {
  setLoading(true, 'Running doctor...');
  elements.doctorOutput.innerHTML = '<span class="text-muted">Running brew doctor...</span>';
  try {
    const result = await window.brew.doctor();
    const output = result.output || result.error || 'No issues found.';
    elements.doctorOutput.innerHTML = `<pre>${escapeHtml(output)}</pre>`;
    if (result.success) {
      elements.doctorOutput.innerHTML = `<span class="success">${escapeHtml(output)}</span>`;
    } else {
      elements.doctorOutput.innerHTML = `<span class="warning">${escapeHtml(output)}</span>`;
    }
  } catch (error) {
    elements.doctorOutput.innerHTML = `<span class="error">Error: ${escapeHtml(error.message)}</span>`;
  }
  setLoading(false);
}

// Cleanup
async function runCleanup(dryRun = false) {
  setLoading(true, dryRun ? 'Previewing cleanup...' : 'Running cleanup...');
  elements.cleanupOutput.innerHTML = `<span class="text-muted">${dryRun ? 'Previewing...' : 'Cleaning up...'}</span>`;
  try {
    const result = await window.brew.cleanup(dryRun);
    const output = result.output || 'Nothing to clean up.';
    elements.cleanupOutput.innerHTML = escapeHtml(output);
  } catch (error) {
    elements.cleanupOutput.innerHTML = `<span class="error">Error: ${escapeHtml(error.message)}</span>`;
  }
  setLoading(false);
}

// Terminal
async function runTerminalCommand() {
  const args = elements.terminalInput.value.trim();
  if (!args) return;

  setLoading(true, 'Running command...');
  const commandHtml = `<div class="terminal-command">$ brew ${escapeHtml(args)}</div>`;

  try {
    const result = await window.brew.custom(args);
    const output = result.output || result.error || 'Command completed.';
    const outputClass = result.success ? '' : 'error';
    elements.terminalHistory.innerHTML = commandHtml + `<div class="${outputClass}">${escapeHtml(output)}</div>`;
  } catch (error) {
    elements.terminalHistory.innerHTML = commandHtml + `<div class="error">Error: ${escapeHtml(error.message)}</div>`;
  }
  setLoading(false);
}

// Modals
function showModal(modalEl) {
  modalEl.classList.remove('hidden');
}

function hideModal(modalEl) {
  modalEl.classList.add('hidden');
}

function showConfirm(title, message) {
  return new Promise(resolve => {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    showModal(elements.confirmModal);

    const handleOk = () => {
      cleanup();
      hideModal(elements.confirmModal);
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      hideModal(elements.confirmModal);
      resolve(false);
    };

    const cleanup = () => {
      elements.confirmOkBtn.removeEventListener('click', handleOk);
      elements.confirmCancelBtn.removeEventListener('click', handleCancel);
    };

    elements.confirmOkBtn.addEventListener('click', handleOk);
    elements.confirmCancelBtn.addEventListener('click', handleCancel);
  });
}

function showOutput(title, content, success = true) {
  elements.outputTitle.textContent = title;
  elements.outputContent.innerHTML = `<span class="${success ? 'success' : 'error'}">${escapeHtml(content)}</span>`;
  showModal(elements.outputModal);
}

async function showPackageDetails(name, isCask) {
  state.currentPackage = { name, isCask };
  elements.modalPackageName.textContent = name;
  elements.modalPackageInfo.textContent = 'Loading...';
  showModal(elements.packageModal);

  try {
    const result = await window.brew.packageInfo(name, isCask);
    if (result.success) {
      elements.modalPackageInfo.textContent = result.info;
    } else {
      elements.modalPackageInfo.innerHTML = `<span class="error">${escapeHtml(result.error)}</span>`;
    }
  } catch (error) {
    elements.modalPackageInfo.innerHTML = `<span class="error">${escapeHtml(error.message)}</span>`;
  }

  // Update pin button
  if (isCask) {
    elements.modalPinBtn.style.display = 'none';
  } else {
    elements.modalPinBtn.style.display = '';
    const pinnedResult = await window.brew.pinned();
    const isPinned = pinnedResult.success && pinnedResult.pinned.includes(name);
    elements.modalPinBtn.textContent = isPinned ? 'Unpin' : 'Pin';
    elements.modalPinBtn.dataset.action = isPinned ? 'unpin' : 'pin';
  }
}

// Package actions
async function installPackage(name, isCask) {
  const typeLabel = isCask ? 'cask' : 'formula';
  const confirmed = await showConfirm('Install Package', `Install ${name} (${typeLabel})?`);
  if (!confirmed) return;

  setLoading(true, `Installing ${name}...`);
  try {
    const result = await window.brew.install(name, isCask);
    showOutput('Installation Result', result.success ? (result.output || 'Installed successfully!') : result.error, result.success);
    if (result.success) {
      await loadInstalledPackages();
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

async function uninstallPackage(name, isCask) {
  const confirmed = await showConfirm('Uninstall Package', `Are you sure you want to uninstall ${name}?`);
  if (!confirmed) return;

  setLoading(true, `Uninstalling ${name}...`);
  try {
    const result = await window.brew.uninstall(name, isCask);
    showOutput('Uninstall Result', result.success ? (result.output || 'Uninstalled successfully!') : result.error, result.success);
    if (result.success) {
      hideModal(elements.packageModal);
      await loadInstalledPackages();
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

async function upgradePackage(name, isCask) {
  setLoading(true, `Upgrading ${name}...`);
  try {
    const result = await window.brew.upgrade(name, isCask);
    showOutput('Upgrade Result', result.success ? (result.output || 'Upgraded successfully!') : result.error, result.success);
    if (result.success) {
      await loadOutdatedPackages();
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

async function pinPackage(name) {
  setLoading(true, `Pinning ${name}...`);
  try {
    const result = await window.brew.pin(name);
    if (result.success) {
      elements.modalPinBtn.textContent = 'Unpin';
      elements.modalPinBtn.dataset.action = 'unpin';
    } else {
      showOutput('Error', result.error, false);
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

async function unpinPackage(name) {
  setLoading(true, `Unpinning ${name}...`);
  try {
    const result = await window.brew.unpin(name);
    if (result.success) {
      elements.modalPinBtn.textContent = 'Pin';
      elements.modalPinBtn.dataset.action = 'pin';
      if (state.currentView === 'pinned') {
        await loadPinned();
      }
    } else {
      showOutput('Error', result.error, false);
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

async function showDependencies(name) {
  setLoading(true, 'Loading dependencies...');
  try {
    const result = await window.brew.deps(name);
    showOutput(`Dependencies of ${name}`, result.success ? (result.output || 'No dependencies.') : result.error, result.success);
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

async function showUses(name) {
  setLoading(true, 'Loading dependents...');
  try {
    const result = await window.brew.uses(name);
    const output = result.success ? (result.uses.length > 0 ? result.uses.join('\n') : 'No installed packages depend on this.') : result.error;
    showOutput(`Packages depending on ${name}`, output, result.success);
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

// Service actions
async function startService(name) {
  setLoading(true, `Starting ${name}...`);
  try {
    const result = await window.brew.serviceStart(name);
    if (result.success) {
      await loadServices();
    } else {
      showOutput('Error', result.error, false);
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

async function stopService(name) {
  setLoading(true, `Stopping ${name}...`);
  try {
    const result = await window.brew.serviceStop(name);
    if (result.success) {
      await loadServices();
    } else {
      showOutput('Error', result.error, false);
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

async function restartService(name) {
  setLoading(true, `Restarting ${name}...`);
  try {
    const result = await window.brew.serviceRestart(name);
    if (result.success) {
      await loadServices();
    } else {
      showOutput('Error', result.error, false);
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

// Tap actions
async function removeTap(name) {
  const confirmed = await showConfirm('Remove Tap', `Remove tap ${name}?`);
  if (!confirmed) return;

  setLoading(true, `Removing tap ${name}...`);
  try {
    const result = await window.brew.tapRemove(name);
    if (result.success) {
      await loadTaps();
    } else {
      showOutput('Error', result.error, false);
    }
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

// Update Homebrew
async function updateBrew() {
  setLoading(true, 'Updating Homebrew...');
  try {
    const result = await window.brew.update();
    showOutput('Update Result', result.success ? (result.output || 'Already up-to-date.') : result.error, result.success);
    await loadBrewInfo();
  } catch (error) {
    showOutput('Error', error.message, false);
  }
  setLoading(false);
}

// Load Homebrew info
async function loadBrewInfo() {
  try {
    const check = await window.brew.check();
    if (!check.installed) {
      elements.brewVersion.innerHTML = '<span class="text-danger">Homebrew not installed</span>';
      return;
    }

    const info = await window.brew.info();
    if (info.success) {
      const versionMatch = info.version.match(/Homebrew\s+([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : info.version.split('\n')[0];
      elements.brewVersion.textContent = `v${version}`;
    }
  } catch (error) {
    elements.brewVersion.innerHTML = '<span class="text-danger">Error loading version</span>';
  }
}

// Event delegation for dynamic elements
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (btn) {
    const action = btn.dataset.action;
    const name = btn.dataset.name;
    const isCask = btn.dataset.cask === 'true';

    switch (action) {
      case 'install':
        await installPackage(name, isCask);
        break;
      case 'uninstall':
        await uninstallPackage(name, isCask);
        break;
      case 'upgrade':
        await upgradePackage(name, isCask);
        break;
      case 'pin':
        await pinPackage(name);
        break;
      case 'unpin':
        await unpinPackage(name);
        break;
      case 'service-start':
        await startService(name);
        break;
      case 'service-stop':
        await stopService(name);
        break;
      case 'service-restart':
        await restartService(name);
        break;
      case 'tap-remove':
        await removeTap(name);
        break;
    }
    return;
  }

  // Package item click (show details)
  const packageItem = e.target.closest('.package-item');
  if (packageItem && !e.target.closest('button')) {
    const name = packageItem.dataset.name;
    const type = packageItem.dataset.type;
    await showPackageDetails(name, type === 'cask');
  }
});

// Event listeners for nav items
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => showView(item.dataset.view));
});

// Event listeners for collapsible nav headers
document.querySelectorAll('.nav-header').forEach(header => {
  header.addEventListener('click', () => {
    const section = header.dataset.section;
    const items = document.querySelector(`.nav-items[data-section="${section}"]`);
    header.classList.toggle('collapsed');
    items.classList.toggle('collapsed');
  });
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.currentFilter = btn.dataset.filter;
    filterAndRenderInstalled();
  });
});

elements.installedSearch.addEventListener('input', filterAndRenderInstalled);
elements.searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchPackages(); });
elements.searchBtn.addEventListener('click', searchPackages);
elements.upgradeAllBtn.addEventListener('click', upgradeAll);
elements.refreshOutdatedBtn.addEventListener('click', loadOutdatedPackages);
elements.refreshServicesBtn.addEventListener('click', loadServices);
elements.addTapBtn.addEventListener('click', addTap);
elements.tapInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTap(); });
elements.refreshTapsBtn.addEventListener('click', loadTaps);
elements.refreshPinnedBtn.addEventListener('click', loadPinned);
elements.refreshLeavesBtn.addEventListener('click', loadLeaves);
elements.autoremoveBtn.addEventListener('click', autoremove);
elements.runDoctorBtn.addEventListener('click', runDoctor);
elements.cleanupDryBtn.addEventListener('click', () => runCleanup(true));
elements.cleanupBtn.addEventListener('click', () => runCleanup(false));
elements.terminalRunBtn.addEventListener('click', runTerminalCommand);
elements.terminalInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') runTerminalCommand(); });
elements.btnUpdateBrew.addEventListener('click', updateBrew);

// Modal events
document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    hideModal(elements.packageModal);
    hideModal(elements.confirmModal);
    hideModal(elements.outputModal);
  });
});

document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', () => {
    hideModal(elements.packageModal);
    hideModal(elements.confirmModal);
    hideModal(elements.outputModal);
  });
});

elements.modalUninstallBtn.addEventListener('click', () => {
  if (state.currentPackage) {
    uninstallPackage(state.currentPackage.name, state.currentPackage.isCask);
  }
});

elements.modalDepsBtn.addEventListener('click', () => {
  if (state.currentPackage) {
    showDependencies(state.currentPackage.name);
  }
});

elements.modalUsesBtn.addEventListener('click', () => {
  if (state.currentPackage) {
    showUses(state.currentPackage.name);
  }
});

elements.modalPinBtn.addEventListener('click', () => {
  if (state.currentPackage && !state.currentPackage.isCask) {
    const action = elements.modalPinBtn.dataset.action;
    if (action === 'pin') {
      pinPackage(state.currentPackage.name);
    } else {
      unpinPackage(state.currentPackage.name);
    }
  }
});

// Initialize
async function init() {
  await loadBrewInfo();
  await loadInstalledPackages();
}

init();
