/** Faculties overview, faculty detail pages and their department data. */
const translations = {
  // Page chrome
  "Fakultetet": "Faculties",
  "Universiteti i Prishtinës": "University of Prishtina",
  "Eksploroni fakultetet e Universitetit të Prishtinës — departamente, lidhje zyrtare dhe materiale.":
    "Explore the faculties of the University of Prishtina — departments, official links and materials.",
  "Eksploro {name}": "Explore {name}",
  "Faqja e {acronym}": "{acronym} website",
  "{n} departamente": "{n} departments",
  "Departamentet": "Departments",
  "+{n} më shumë": "+{n} more",
  "Kthehu te fakultetet": "Back to faculties",
  "Faqja zyrtare": "Official website",
  "Departamente": "Departments",
  "Themeluar": "Established",
  "Vendndodhja": "Location",
  "Telefon": "Phone",
  "Materialet për këtë fakultet": "Materials for this faculty",

  // Faculty names (not already in materials.js)
  "Fakulteti i Filologjisë": "Faculty of Philology",
  "Fakulteti i Ekonomisë": "Faculty of Economics",
  "Fakulteti i Filozofisë": "Faculty of Philosophy",
  "Fakulteti i Shkencave Matematikore dhe Natyrore": "Faculty of Mathematics and Natural Sciences",

  // Departments
  "Histori": "History",
  "Sociologji": "Sociology",
  "Filozofi": "Philosophy",
  "Psikologji": "Psychology",
  "Shkenca Politike": "Political Science",
  "Shkenca politike": "Political Science",
  "Punë Sociale": "Social Work",
  "Antropologji": "Anthropology",
  "Matematikë": "Mathematics",
  "Fizikë": "Physics",
  "Kimi": "Chemistry",
  "Biologji": "Biology",
  "Gjeografi": "Geography",
  "Gjuhë Shqipe": "Albanian Language",
  "Letërsi Shqipe": "Albanian Literature",
  "Gjuhë dhe Letërsi Angleze": "English Language and Literature",
  "Gjuhë dhe Letërsi Gjermane": "German Language and Literature",
  "Gjuhë dhe Letërsi Frënge": "French Language and Literature",
  "Orientalistikë": "Oriental Studies",
  "Gjuhë dhe Letërsi Turke": "Turkish Language and Literature",
  "Gazetari": "Journalism",
  "Juridik": "Law",
  "Juridik i Përgjithshëm": "General Law",
  "Banka dhe Financa": "Banking and Finance",
  "Menaxhment": "Management",
  "Marketing": "Marketing",
  "Ekonomiks": "Economics",
  "Kontabilitet": "Accounting",
  "Ekonomi e aplikuar dhe menaxhment": "Applied Economics and Management",
  "Konstruksione": "Structures",
  "Hidroteknikë": "Hydraulic Engineering",
  "Gjeodezi": "Geodesy",
  "Inxhinieri e Ambientit": "Environmental Engineering",
  "Inxhinieri Kompjuterike": "Computer Engineering",
  "Inxhinieri Kompjuterike dhe Softuerike": "Computer and Software Engineering",
  "Elektronikë, Automatikë dhe Robotikë": "Electronics, Automation and Robotics",
  "Teknologji e Informimit dhe e Komunikimit": "Information and Communication Technology",
  "Teknologjitë e Informacionit dhe Komunikimit": "Information and Communication Technologies",
  "Elektroenergjetikë": "Power Engineering",
  "Mjekësi e Përgjithshme": "General Medicine",
  "Mjekësi e përgjithshme": "General Medicine",
  "Stomatologji": "Dentistry",
  "Farmaci": "Pharmacy",
  "Fizioterapi": "Physiotherapy",
  "Infermieri": "Nursing",
  "Artet e Bukura": "Fine Arts",
  "Artet Dramatike": "Dramatic Arts",
  "Artet Muzikore": "Musical Arts",
  "Prodhim Bimor": "Plant Production",
  "Prodhim bimor": "Plant Production",
  "Ekonomia e Bujqësisë": "Agricultural Economics",
  "Ekonomia e bujqësisë": "Agricultural Economics",
  "Prodhimtari Shtazore": "Animal Production",
  "Prodhimtari shtazore": "Animal Production",
  "Mjekësi Veterinare": "Veterinary Medicine",
  "Teknologji Ushqimore me Bioteknologji": "Food Technology with Biotechnology",
  "Teknologji ushqimore me bioteknologji": "Food Technology with Biotechnology",
  "Edukim Fizik dhe Sport": "Physical Education and Sport",
  "Edukimi në Fëmijëri Të Hershme": "Early Childhood Education",
  "Edukimi në Fëmijëri të Hershme (0-6 vjeç)": "Early Childhood Education (ages 0-6)",
  "Edukimi Fillor": "Primary Education",
  "Pedagogji e Përgjithshme": "General Pedagogy",
  "Arkitekturë": "Architecture",
  "Prodhimtari dhe Inxhinieri Industriale": "Production and Industrial Engineering",
  "Termoenergjetikë dhe Energji të Ripërtëritshme": "Thermal Power Engineering and Renewable Energy",
  "Dizajn inxhinierik dhe Automjete": "Engineering Design and Vehicles",
  "Komunikacion dhe transport": "Communication and Transport",
  "Mekatronikë": "Mechatronics",

  // Faculty and department descriptions
  "Fakulteti i Arteve ofron programe në artet e bukura, muzikë, dramë dhe disiplina të tjera krijuese, duke nxitur shprehjen artistike dhe zhvillimin kulturor.":
    "The Faculty of Arts offers programmes in fine arts, music, drama and other creative disciplines, fostering artistic expression and cultural development.",
  "Departamenti i Arteve të Bukura, është program studimor më i madhi në Fakultetin e  Arteve me 298 studentë aktivë, 25 profesorë me kohë të plotë, 31 profesorë me kohë të pjesshme nga Universiteti i Prishtinës dhe 13 profesorë ndihmës me kohë të pjesshme.":
    "The Department of Fine Arts is the largest study programme in the Faculty of Arts, with 298 active students, 25 full-time professors, 31 part-time professors from the University of Prishtina and 13 part-time assistant professors.",
  "Departamenti i Arteve Dramatike (DAD) është program studimor në Fakultetin e  Arteve me 250 studentë aktivë, 32 profesorë me kohë të plotë, 1 profesor me kohë të pjesshme nga Universiteti i Prishtinës dhe 20 profesorë ndihmës me kohë të pjesshme dhe 3 profesorë vizitorë.":
    "The Department of Dramatic Arts (DAD) is a study programme in the Faculty of Arts with 250 active students, 32 full-time professors, 1 part-time professor from the University of Prishtina, 20 part-time assistant professors and 3 visiting professors.",
  "Në Degen e Arteve Muzikore janë të organizuara gjithsej 2 programe studimi në Bachelor dhe 3 programe të studimit në Master që përfshijnë të gjitha specializimet e veçanta përmes specializimeve të ndryshme.":
    "The Musical Arts branch comprises a total of 2 Bachelor study programmes and 3 Master study programmes, covering all the particular specializations through various tracks.",
  "Fakulteti i Ekonomisë ofron programe në ekonomi, administrim biznesi, menaxhim dhe fusha të tjera të lidhura me të, duke i përgatitur studentët për karriera në sektorët e biznesit dhe ekonomisë.":
    "The Faculty of Economics offers programmes in economics, business administration, management and other related fields, preparing students for careers in the business and economic sectors.",
  "Ky program vë theksin në përdorimin e koncepteve ekonomike, financiare, dhe analizave kritike për të zgjidhur probleme ekonomike dhe financiare, në fushën e bankave dhe financave.":
    "This programme emphasizes the use of economic and financial concepts and critical analysis to solve economic and financial problems in the field of banking and finance.",
  "Ky program është i konceptuar t’i shtojë kapacitetet menaxhuese të invidivëde dhe t’i përgatisë menaxherët e rinj të organizatave, në kushtet kur aftësia vendimmarrëse dhe menaxhimi shkojnë përtej pozitave formale.":
    "This programme is designed to build individuals' managerial capacities and prepare new managers of organizations, in conditions where decision-making ability and management go beyond formal positions.",
  "Ky program ka për qellim të përgatisë kuadro që kontribuojnë në progresin e përgjithshëm ekonomik dhe shoqëror të Kosovës dhe më gjerë, për të përparuar dijen globale në fushën e marketingut.":
    "This programme aims to prepare professionals who contribute to the overall economic and social progress of Kosovo and beyond, advancing global knowledge in the field of marketing.",
  "Qëllimi i Programit Ekonomiks është të pajisë studentët me aftësitë për zgjidhjen e problemeve, për të mundësuar atyre që të punojnë në mënyrë të pavarur dhe me përgjegjësi në fushat e ardhshme profesionale.":
    "The aim of the Economics Programme is to equip students with problem-solving skills, enabling them to work independently and responsibly in their future professional fields.",
  "Programi i Kontabilitetit ofron një mjedis që i përkushtohet studentëve, që promovon përsosmërinë akademike, ngritjen profesionale dhe personale përmes frymës kolegjiale me sjellje etike dhe profesionale.":
    "The Accounting programme offers an environment dedicated to students that promotes academic excellence and professional and personal growth through a collegial spirit with ethical and professional conduct.",
  "Ky Program ofron njohuri të thella mbi teoritë ekonomike dhe një gamë të gjerë të shkathtësive rreth biznesit, çështjeve organizative dhe financimit duke përdorë metoda analitike e dhe kuantitative.":
    "This programme offers in-depth knowledge of economic theories and a wide range of skills in business, organizational issues and financing, using analytical and quantitative methods.",
  "Fakulteti i Edukimit ofron programe trajnimi për mësues dhe edukative, duke përgatitur edukatorë për nivele të ndryshme të sistemit arsimor.":
    "The Faculty of Education offers teacher training and educational programmes, preparing educators for different levels of the education system.",
  "Qëllimi kryesor i programit është përgatitja e edukatorëve të ardhshëm të cilët do të jenë kompetentë në punën profesionale në fëmijëri të hershme":
    "The main goal of the programme is to prepare future educators who will be competent in professional work in early childhood",
  "Programi synon të pajisë studentët me njohuritë e përmbajtjes kurrikulare për nivelin e dhënë":
    "The programme aims to equip students with knowledge of the curricular content for the given level",
  "Ky program synon arsimin bazë pedagogjik me fokus në lëndët që trajtojnë aspekte teorike dhe praktike në sferat pedagogjike, sociale dhe kulturore":
    "This programme aims at a basic pedagogical education, focusing on subjects that address theoretical and practical aspects in the pedagogical, social and cultural spheres",
  "Fakulteti i Arkitekturës përqendrohet posaçërisht në disiplinat e dizajnit arkitektonik, planifikimit urban dhe dizajnit mjedisor.":
    "The Faculty of Architecture focuses specifically on the disciplines of architectural design, urban planning and environmental design.",
  "Fakulteti i Bujqësisë dheVeterinarisë ofron arsim në shkencat bujqësore, mjekësinë veterinare dhe fusha të tjera që mbështesin zhvillimin rural.":
    "The Faculty of Agriculture and Veterinary offers education in agricultural sciences, veterinary medicine and other fields that support rural development.",
  "FEFS ofron programe në edukim fizik, menaxhim sportiv, kineziologji dhe disiplina të lidhura me sportin dhe aktivitetin fizik.":
    "FEFS offers programmes in physical education, sports management, kinesiology and disciplines related to sport and physical activity.",
  "Fakulteti i Filologjisë i është kushtuar studimit të gjuhës, letërsisë dhe kulturës. Ofron programe të larmishme që mbulojnë gjuhë të ndryshme, teori letrare dhe studime kulturore, duke nxitur të menduarit kritik dhe aftësitë e komunikimit.":
    "The Faculty of Philology is dedicated to the study of language, literature and culture. It offers a diverse range of programmes covering different languages, literary theory and cultural studies, fostering critical thinking and communication skills.",
  "Fakulteti i Filozofisë ofron programe në filozofi, psikologji, sociologji dhe disiplina të lidhura me shkencat humane, duke nxitur të menduarit kritik dhe kërkimin në shkencat shoqërore.":
    "The Faculty of Philosophy offers programmes in philosophy, psychology, sociology and disciplines related to the humanities, fostering critical thinking and research in the social sciences.",
  "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike ofron programe në inxhinieri elektrike, inxhinieri kompjuterike, telekomunikacion dhe teknologji informacioni.":
    "The Faculty of Electrical and Computer Engineering offers programmes in electrical engineering, computer engineering, telecommunications and information technology.",
  "Fakulteti i Inxhinierisë Mekanike ofron arsim në inxhinieri mekanike, inxhinieri industriale dhe disiplina teknike të lidhura me to.":
    "The Faculty of Mechanical Engineering offers education in mechanical engineering, industrial engineering and related technical disciplines.",
  "Fakulteti i Shkencave Matematikore dhe Natyrore siguron arsim dhe hulumtim në matematikë, fizikë, kimi, biologji dhe disiplina shkencore të lidhura.":
    "The Faculty of Mathematics and Natural Sciences provides education and research in mathematics, physics, chemistry, biology and related scientific disciplines.",
  "Fakulteti Juridik siguron një edukim gjithëpërfshirës juridik, duke mbuluar degë të ndryshme të ligjit, teori juridike dhe praktikë, duke përgatitur studentët për karrierë në profesionin juridik.":
    "The Faculty of Law provides a comprehensive legal education, covering different branches of law, legal theory and practice, preparing students for careers in the legal profession.",
};

export default translations;
