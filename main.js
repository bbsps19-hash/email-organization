const emlInput = document.getElementById('emlInput');
const dropZone = document.getElementById('dropZone');
const fileList = document.getElementById('fileList');
const emptyState = document.querySelector('.file-empty');

const isEmlFile = (file) =>
  file.name.toLowerCase().endsWith('.eml') || file.type === 'message/rfc822';

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = (bytes / 1024 ** idx).toFixed(idx === 0 ? 0 : 1);
  return `${size} ${units[idx]}`;
};

const renderFiles = (files) => {
  fileList.innerHTML = '';

  if (!files.length) {
    emptyState.hidden = false;
    fileList.hidden = true;
    return;
  }

  emptyState.hidden = true;
  fileList.hidden = false;

  files.forEach((file) => {
    const li = document.createElement('li');
    const name = document.createElement('strong');
    const size = document.createElement('span');

    name.textContent = file.name;
    size.textContent = formatSize(file.size);

    li.append(name, size);
    fileList.appendChild(li);
  });
};

const handleFiles = (fileListInput) => {
  const files = Array.from(fileListInput).filter(isEmlFile).slice(0, 10);
  renderFiles(files);
};

emlInput.addEventListener('change', (event) => {
  handleFiles(event.target.files);
});

dropZone.addEventListener('click', () => emlInput.click());

dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emlInput.click();
  }
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('is-dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('is-dragover');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('is-dragover');
  if (event.dataTransfer?.files?.length) {
    handleFiles(event.dataTransfer.files);
  }
});
