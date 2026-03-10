// Change this to your Render URL when you deploy
var API_URL = "https://workexp-backend.onrender.com"


/* ── STEP COMPLETION ─────────────────────────────────────────────────────── */

// Which required fields belong to each section
var sectionFields = {
  step1: ['fn', 'ln', 'se', 'dob', 'gd', 'yr', 'en', 'ep'],
  step2: ['sn', 'sml', 'sph', 'tn'],
  step3: ['sd', 'ed', 'ind', 'mot'],
  step4: ['c1', 'c2', 'c3']
}

// Shade a step circle when all its required fields are filled
function updateSteps() {
  Object.keys(sectionFields).forEach(function(stepId) {
    var allFilled = sectionFields[stepId].every(function(fieldId) {
      var el = document.getElementById(fieldId)
      if (!el) return false
      if (el.type === 'checkbox') return el.checked
      return el.value.trim() !== ''
    })
    var stepEl = document.getElementById(stepId)
    if (allFilled) {
      stepEl.classList.add('active')
    } else {
      // Step 1 stays shaded by default, others unshade if incomplete
      if (stepId !== 'step1') stepEl.classList.remove('active')
    }
  })
}

// Run whenever any field changes
document.getElementById('regForm').addEventListener('input', updateSteps)
document.getElementById('regForm').addEventListener('change', updateSteps)

// Smooth scroll to a section when a step circle is clicked
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' })
}


/* ── POSTCODE LOOKUP ─────────────────────────────────────────────────────── */
async function doPC() {
  var pcEl = document.getElementById('pc')
  var btn  = document.getElementById('pcBtn')
  var err  = document.getElementById('pcE')
  var blk  = document.getElementById('addrBlock')
  var pc   = pcEl.value.trim().replace(/\s/g, '')

  if (!pc) { err.textContent = 'Please enter a postcode.'; err.classList.add('show'); return; }

  btn.textContent = 'Looking up…'
  btn.disabled = true
  err.classList.remove('show')

  try {
    var r = await fetch('https://api.postcodes.io/postcodes/' + encodeURIComponent(pc))
    var d = await r.json()
    if (d.status === 200) {
      var x = d.result
      document.getElementById('a2').value    = x.parish || ''
      document.getElementById('city').value  = x.admin_district || x.parliamentary_constituency || ''
      document.getElementById('county').value = x.admin_county || x.region || ''
      pcEl.value = x.postcode
      blk.style.display = 'block'
      err.classList.remove('show')
    } else {
      err.textContent = 'Postcode not found. Please check and try again.'
      err.classList.add('show')
      blk.style.display = 'none'
    }
  } catch(e) {
    err.textContent = 'Lookup unavailable — please enter address manually.'
    err.classList.add('show')
    blk.style.display = 'block'
  }

  btn.textContent = 'Find Address'
  btn.disabled = false
}

document.getElementById('pc').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') { e.preventDefault(); doPC(); }
})


/* ── HELPERS ─────────────────────────────────────────────────────────────── */
function getVal(id) {
  var el = document.getElementById(id)
  return el ? el.value.trim() : ''
}
function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}
function markErr(inputId, errId, msg) {
  var el = document.getElementById(inputId)
  var er = document.getElementById(errId)
  if (el) el.classList.add('err')
  if (er) { er.textContent = msg; er.classList.add('show') }
}
function clearErr(inputId, errId) {
  var el = document.getElementById(inputId)
  var er = document.getElementById(errId)
  if (el) el.classList.remove('err')
  if (er) er.classList.remove('show')
}

// Clear field errors as user types
document.querySelectorAll('.fi,.fs,.ft').forEach(function(el) {
  el.addEventListener('input', function() {
    el.classList.remove('err')
    var er = document.getElementById(el.id + 'E')
    if (er) er.classList.remove('show')
  })
})


/* ── FORM SUBMIT ─────────────────────────────────────────────────────────── */
document.getElementById('regForm').addEventListener('submit', function(e) {
  e.preventDefault()

  // Validate required fields
  var ok = true
  var rules = [
    ['fn',  'fnE',  "Please enter the student's first name.", false],
    ['ln',  'lnE',  "Please enter the student's last name.",  false],
    ['se',  'seE',  "Please enter a valid email address.",    true ],
    ['dob', 'dobE', "Please enter the date of birth.",        false],
    ['gd',  'gdE',  "Please select a gender.",                false],
    ['yr',  'yrE',  "Please select a year group.",            false],
    ['en',  'enE',  "Please enter emergency contact name.",   false],
    ['ep',  'epE',  "Please enter emergency contact phone.",  false],
    ['sn',  'snE',  "Please enter the school name.",          false],
    ['sml', 'smlE', "Please enter a valid school email.",     true ],
    ['sph', 'sphE', "Please enter the school phone.",         false],
    ['tn',  'tnE',  "Please enter the teacher's name.",       false],
    ['sd',  'sdE',  "Please select a start date.",            false],
    ['ed',  'edE',  "Please select an end date.",             false],
    ['ind', 'indE', "Please select a department.",            false],
    ['mot', 'motE', "Please write a short statement.",        false],
  ]

  rules.forEach(function(r) {
    var v   = getVal(r[0])
    var bad = (v === '') || (r[3] && !validEmail(v))
    if (bad) { markErr(r[0], r[1], r[2]); ok = false; }
    else     { clearErr(r[0], r[1]); }
  })

  // Validate consent checkboxes
  var consentOk = ['c1', 'c2', 'c3'].every(function(id) {
    var el = document.getElementById(id)
    return el && el.checked
  })
  var conEl = document.getElementById('conE')
  if (!consentOk) { conEl.classList.add('show'); ok = false; }
  else              conEl.classList.remove('show')

  if (!ok) {
    var firstBad = document.querySelector('.fi.err,.fs.err,.ft.err')
    if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  // Disable button and show spinner while sending
  var btn = document.querySelector('.sub-btn')
  btn.disabled = true
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>&nbsp;Submitting…'

  // Collect all form data
  var cmEl = document.getElementById('cm')
  var data = {
    first_name:        getVal('fn'),
    last_name:         getVal('ln'),
    student_email:     getVal('se'),
    dob:               getVal('dob'),
    gender:            getVal('gd'),
    year_group:        getVal('yr'),
    student_phone:     getVal('sphone'),
    ethnicity:         getVal('eth'),
    emergency_name:    getVal('en'),
    emergency_phone:   getVal('ep'),
    school_name:       getVal('sn'),
    school_email:      getVal('sml'),
    school_phone:      getVal('sph'),
    tutor_name:        getVal('tn'),
    postcode:          getVal('pc'),
    addr1:             getVal('a1'),
    addr2:             getVal('a2'),
    city:              getVal('city'),
    county:            getVal('county'),
    start_date:        getVal('sd'),
    end_date:          getVal('ed'),
    department:        getVal('ind'),
    motivation:        getVal('mot'),
    requirements:      getVal('req'),
    marketing_consent: (cmEl && cmEl.checked) ? true : false
  }

  // Send to backend
  fetch(API_URL + '/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(response) { return response.json() })
  .then(function(result) {
    if (result.error) {
      alert('Error: ' + result.error)
      btn.disabled = false
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Submit Registration'
    } else {
      var panel = document.getElementById('successPanel')
      panel.style.display = 'block'
      panel.scrollIntoView({ behavior: 'smooth', block: 'center' })
      document.getElementById('regForm').reset()
      var ab = document.getElementById('addrBlock')
      if (ab) ab.style.display = 'none'
      btn.disabled = false
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Submit Registration'
    }
  })

})


/* ── FAQ ─────────────────────────────────────────────────────────────────── */
var FAQS = [
  {q:"Who is eligible to apply for a NatWest work experience placement?",a:"<p>Placements are open to students in Years 10–13 and those in Further Education. Students must be at least 14 years old. All applicants must have written parental or guardian consent confirmed before a placement can be approved.</p>"},
  {q:"How long does a typical placement last?",a:"<p>Most placements run for 1–2 weeks (5–10 working days). Duration varies by department. Please indicate your preferred dates on the form and we will do our best to accommodate them.</p>"},
  {q:"Is the placement paid?",a:"<p>Work experience placements are unpaid as they form part of an educational programme. Students gain real-world skills, a NatWest reference letter, and exposure to banking and finance to support future applications.</p>"},
  {q:"What documents are required before the placement starts?",a:"<ul><li>Signed Parental / Guardian Consent Form</li><li>Emergency Contact Details (included in this form)</li><li>School authorisation / teacher sign-off letter</li><li>Any relevant medical or accessibility information</li></ul><p style='margin-top:8px'>Our team will send document templates once your application is reviewed.</p>"},
  {q:"How long does it take to hear back after submitting?",a:"<p>We aim to respond to all applications within <strong>5–7 working days</strong>. A confirmation email will be sent to the address provided. Please check your junk/spam folder if you haven't heard back.</p>"},
  {q:"Can I choose which team or department I work with?",a:"<p>Yes — you can indicate your preferred area of interest on the form. We will do our best to match your preference, though placement is subject to availability and operational capacity.</p>"},
  {q:"What if I need to cancel or change my placement dates?",a:"<p>Please notify us at least <strong>5 working days before</strong> your scheduled start date. Late cancellations may affect future applications. Reply to your confirmation email to make any changes.</p>"},
  {q:"What will I be doing on a typical day?",a:"<ul><li>Shadowing professionals in meetings and client calls</li><li>Assisting with live projects and research tasks</li><li>Attending team briefings and company tours</li><li>Completing a short end-of-week project or presentation</li><li>Meeting colleagues across different functions</li></ul>"},
  {q:"Is there a dress code during the placement?",a:"<p>Students should dress in <strong>smart casual</strong> attire throughout their placement unless otherwise stated. If your role involves a specialist environment, our team will advise on appropriate clothing in advance.</p>"},
  {q:"How is my personal data handled?",a:"<p>All data submitted via this form is collected and processed under UK GDPR and the Data Protection Act 2018. Your data is used solely for administering your placement and will not be shared without consent. You may request deletion at any time.</p>"},
]

var g = document.getElementById('faqG')
FAQS.forEach(function(f, i) {
  var d = document.createElement('div')
  d.className = 'faq-item'
  d.innerHTML = '<button class="faq-btn" onclick="tFaq(this,' + i + ')" aria-expanded="false"><span>' + f.q + '</span><span class="faq-chev">+</span></button><div class="faq-ans" id="fa' + i + '"><div class="faq-ans-inner">' + f.a + '</div></div>'
  g.appendChild(d)
})

function tFaq(btn, i) {
  var ans  = document.getElementById('fa' + i)
  var open = ans.classList.contains('open')
  document.querySelectorAll('.faq-ans').forEach(function(a) { a.classList.remove('open') })
  document.querySelectorAll('.faq-btn').forEach(function(b) { b.classList.remove('open'); b.setAttribute('aria-expanded','false') })
  if (!open) {
    ans.classList.add('open')
    btn.classList.add('open')
    btn.setAttribute('aria-expanded', 'true')
  }
}