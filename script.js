document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const pdfFileInput = document.getElementById('pdfFile');
    const fileNameDisplay = document.getElementById('fileName');
    const uploadLoading = document.getElementById('uploadLoading');
    const uploadResults = document.getElementById('uploadResults');

    if (pdfFileInput) {
        pdfFileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                fileNameDisplay.textContent = `Selected: ${file.name}`;
            }
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const file = pdfFileInput.files[0];
            if (!file) {
                alert('Please select a PDF file first');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }

            uploadLoading.classList.remove('hidden');
            uploadResults.innerHTML = '';
            uploadResults.classList.add('hidden');

            try {
                const reader = new FileReader();
                reader.onload = async function(event) {
                    const base64Data = event.target.result.split(',')[1];

                    try {
                        const response = await fetch('/.netlify/functions/analyze', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/octet-stream',
                            },
                            body: base64Data
                        });

                        const data = await response.json();
                        uploadLoading.classList.add('hidden');

                        if (data.error) {
                            displayError(data.message || data.error);
                        } else if (data.message) {
                            displayError(data.message);
                        } else {
                            displayResults(data);
                        }
                    } catch (error) {
                        uploadLoading.classList.add('hidden');
                        displayError('Failed to analyze the PDF. Please try again.');
                        console.error('Analysis error:', error);
                    }
                };

                reader.readAsDataURL(file);
            } catch (error) {
                uploadLoading.classList.add('hidden');
                displayError('Failed to read the PDF file. Please try again.');
                console.error('File reading error:', error);
            }
        });
    }
});

function displayError(message) {
    const uploadResults = document.getElementById('uploadResults');
    uploadResults.innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
            <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                    <h3 class="font-bold text-red-800 mb-1">Unable to Analyze Results</h3>
                    <p class="text-red-700 text-sm">${message}</p>
                    <p class="text-red-600 text-sm mt-2">Please make sure your PDF contains CBC results with subject names and grades (E, M, A, or B).</p>
                </div>
            </div>
        </div>
    `;
    uploadResults.classList.remove('hidden');
}

function displayResults(data) {
    const { subjects, analysis } = data;
    const uploadResults = document.getElementById('uploadResults');

    const gradeColors = {
        E: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-100' },
        M: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-100' },
        A: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100' },
        B: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-100' }
    };

    const gradeNames = {
        E: 'Exceeds Expectations',
        M: 'Meets Expectations',
        A: 'Approaches Expectations',
        B: 'Below Expectations'
    };

    let performanceColor = 'blue';
    if (analysis.overallPerformance === 'Excellent') performanceColor = 'green';
    else if (analysis.overallPerformance === 'Good') performanceColor = 'blue';
    else if (analysis.overallPerformance === 'Fair') performanceColor = 'yellow';
    else performanceColor = 'red';

    let html = `
        <div class="space-y-6">
            <div class="bg-gradient-to-r from-${performanceColor}-500 to-${performanceColor}-600 rounded-xl p-6 text-white">
                <h3 class="text-2xl font-bold mb-2">Performance Summary</h3>
                <div class="grid md:grid-cols-3 gap-4 mt-4">
                    <div class="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                        <div class="text-3xl font-bold">${analysis.totalSubjects}</div>
                        <div class="text-sm">Subjects Analyzed</div>
                    </div>
                    <div class="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                        <div class="text-3xl font-bold">${analysis.averageScore}%</div>
                        <div class="text-sm">Average Score</div>
                    </div>
                    <div class="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                        <div class="text-3xl font-bold">${analysis.overallPerformance}</div>
                        <div class="text-sm">Overall Rating</div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Subject Breakdown</h3>
                <div class="grid md:grid-cols-2 gap-3">
    `;

    Object.entries(subjects).forEach(([subject, grade]) => {
        const colors = gradeColors[grade];
        html += `
            <div class="border-l-4 ${colors.border} ${colors.bg} p-4 rounded-r-lg">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800">${subject}</h4>
                        <p class="text-sm ${colors.text}">${gradeNames[grade]}</p>
                    </div>
                    <span class="text-2xl font-bold ${colors.text}">${grade}</span>
                </div>
            </div>
        `;
    });

    html += `
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Grade Distribution</h3>
                <div class="grid grid-cols-4 gap-3">
                    <div class="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div class="text-3xl font-bold text-green-700">${analysis.gradeBreakdown.E}</div>
                        <div class="text-sm text-gray-600">E Grades</div>
                    </div>
                    <div class="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div class="text-3xl font-bold text-blue-700">${analysis.gradeBreakdown.M}</div>
                        <div class="text-sm text-gray-600">M Grades</div>
                    </div>
                    <div class="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                        <div class="text-3xl font-bold text-yellow-700">${analysis.gradeBreakdown.A}</div>
                        <div class="text-sm text-gray-600">A Grades</div>
                    </div>
                    <div class="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                        <div class="text-3xl font-bold text-red-700">${analysis.gradeBreakdown.B}</div>
                        <div class="text-sm text-gray-600">B Grades</div>
                    </div>
                </div>
            </div>
    `;

    if (analysis.strengths.length > 0) {
        html += `
            <div class="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
                <h3 class="font-bold text-green-800 text-lg mb-3">Strengths</h3>
                <div class="space-y-2">
        `;
        analysis.strengths.forEach(({ subject, grade }) => {
            html += `
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-green-700 font-medium">${subject} (Grade ${grade})</span>
                </div>
            `;
        });
        html += `
                </div>
            </div>
        `;
    }

    if (analysis.needsImprovement.length > 0) {
        html += `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
                <h3 class="font-bold text-yellow-800 text-lg mb-3">Needs Attention</h3>
                <div class="space-y-2">
        `;
        analysis.needsImprovement.forEach(({ subject, grade }) => {
            html += `
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-yellow-700 font-medium">${subject} (Grade ${grade})</span>
                </div>
            `;
        });
        html += `
                </div>
            </div>
        `;
    }

    if (analysis.recommendedPathways.length > 0) {
        html += `
            <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                <h3 class="font-bold text-blue-800 text-lg mb-3">Recommended Pathways</h3>
                <p class="text-sm text-blue-700 mb-3">Based on your child's strengths, these educational pathways may be suitable:</p>
                <div class="space-y-2">
        `;
        analysis.recommendedPathways.forEach(pathway => {
            html += `
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-blue-700 font-medium">${pathway}</span>
                </div>
            `;
        });
        html += `
                </div>
            </div>
        `;
    }

    if (analysis.recommendations.length > 0) {
        html += `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Recommendations</h3>
                <div class="space-y-3">
        `;
        analysis.recommendations.forEach(rec => {
            let iconColor = 'gray';
            let bgColor = 'gray';
            if (rec.type === 'urgent') {
                iconColor = 'red';
                bgColor = 'red';
            } else if (rec.type === 'positive') {
                iconColor = 'green';
                bgColor = 'green';
            } else {
                iconColor = 'blue';
                bgColor = 'blue';
            }

            html += `
                <div class="flex items-start gap-3 p-4 bg-${bgColor}-50 rounded-lg border border-${bgColor}-200">
                    <svg class="w-5 h-5 text-${iconColor}-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                    <p class="text-${iconColor}-700 text-sm">${rec.message}</p>
                </div>
            `;
        });
        html += `
                </div>
            </div>
        `;
    }

    html += `
        </div>
    `;

    uploadResults.innerHTML = html;
    uploadResults.classList.remove('hidden');
}
