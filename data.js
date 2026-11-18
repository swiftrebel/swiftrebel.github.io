// Base de datos ficticia (reemplazar por API más adelante)
const CATS=[
 {id:'futbol',n:'Canchas de fútbol',e:'⚽',g:['#34c759','#0a6b2d'],slots:['08:00','09:00','10:00','16:00','17:00','18:00','19:00','20:00','21:00']},
 {id:'barberia',n:'Barberías',e:'💈',g:['#ff9f0a','#a1400a'],slots:['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00']},
 {id:'yates',n:'Yates',e:'🛥️',g:['#0a84ff','#032e6b'],slots:['08:00','13:00','17:00']},
 {id:'padel',n:'Pádel y tenis',e:'🎾',g:['#bf5af2','#4a1a7a'],slots:['07:00','08:00','09:00','18:00','19:00','20:00']},
 {id:'spa',n:'Spa y masajes',e:'💆',g:['#ff6482','#8a1a3a'],slots:['10:00','11:00','12:00','15:00','16:00','17:00']}];
const VENUES=[
 {id:1,c:'yates',n:'Azimut 55 Perla',e:'🛥️',g:['#3aa0ff','#04224f'],p:420,u:'hora',r:4.9,z:'Amador',d:'Yate de lujo para 12 personas con capitán, hielo y equipo de snorkel incluidos.',t:['12 pers.','Capitán','Snorkel']},
 {id:2,c:'futbol',n:'Cancha Estadio 7',e:'⚽',g:['#3ddc6a','#08501f'],p:45,u:'hora',r:4.7,z:'San Miguelito',d:'Césped sintético, fútbol 7, iluminación LED y vestidores.',t:['Fútbol 7','Luz LED','Vestidores']},
 {id:3,c:'barberia',n:'Don Fade Barbershop',e:'💈',g:['#ffb340','#7a2e05'],p:18,u:'corte',r:4.8,z:'Bella Vista',d:'Cortes clásicos, degradados y afeitado con toalla caliente.',t:['Degradado','Barba','Café']},
 {id:4,c:'padel',n:'Padel Club Costa',e:'🎾',g:['#c777ff','#3b1066'],p:30,u:'hora',r:4.6,z:'Costa del Este',d:'Canchas panorámicas con alquiler de palas y pelotas.',t:['Panorámica','Palas','Bar']},
 {id:5,c:'futbol',n:'Arena Fútbol 5',e:'🥅',g:['#2ad4a0','#07473a'],p:30,u:'hora',r:4.5,z:'Betania',d:'Cancha techada ideal para jugar aunque llueva.',t:['Techada','Fútbol 5','Parqueo']},
 {id:6,c:'spa',n:'Calma Spa Urbano',e:'💆',g:['#ff7a95','#6e1230'],p:55,u:'sesión',r:4.9,z:'Obarrio',d:'Masaje descontracturante y aromaterapia en cabinas privadas.',t:['60 min','Privado','Aromas']},
 {id:7,c:'yates',n:'Catamarán Sunset',e:'⛵',g:['#5ac8fa','#0a3d62'],p:300,u:'hora',r:4.8,z:'Isla Taboga',d:'Navega al atardecer con música, bebidas y vista al canal.',t:['Atardecer','Bebidas','Música']},
 {id:8,c:'barberia',n:'The Gentleman',e:'✂️',g:['#e0a96d','#4a2a0f'],p:25,u:'corte',r:4.7,z:'Punta Pacífica',d:'Barbería premium con whisky bar y cita previa.',t:['Premium','Whisky','Barba']},
 {id:9,c:'futbol',n:'Camp Nou Panamá',e:'🏟️',g:['#4cd964','#0b3d1a'],p:70,u:'hora',r:4.6,z:'Juan Díaz',d:'Fútbol 11 con grama natural y graderías.',t:['Fútbol 11','Grama','Gradas']},
 {id:10,c:'spa',n:'Zen Retreat',e:'🧖',g:['#ff9ab0','#5a1a45'],p:80,u:'sesión',r:4.8,z:'Clayton',d:'Circuito de hidroterapia, sauna y masaje en pareja.',t:['Pareja','Sauna','90 min']}];
