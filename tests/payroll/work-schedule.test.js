/* v21.66: official work schedules per group (Administration memo of 4 Oct 2026). */
module.exports=[
{ name:'🕖 Official schedules: driver (DRIVERS) at 05:10 = late 10 min, at 04:58 present; Antonio Garcia (APTI_REGULAR, by name) at 06:05 = late 5, at 06:00 present; contractor (CONTRACTUAL) at 07:50 present, 08:01 late 1; Edwin Suitado (contractor by type) at 07:00 present, 07:01 late 1; production at 06:50 present; admin at 07:30 late 30; maintenance end 17:30; HR-card schedStart 09:00 beats the table (v21.66)',
  run:async()=>{
    const E=[labour('D1','DELA CRUZ, JUAN',{dept:'DRIVERS'}),labour('AG','GARCIA, ANTONIO JR',{dept:'APTI_REGULAR'}),labour('C1','REYES, PEDRO',{dept:'CONTRACTUAL'}),labour('ED','SUITADO, EDWIN',{dept:'CONTRACTUAL',employmentType:'Contractual'}),labour('P1','SANTOS, ANA',{dept:'PROD_TRAINEES'}),office('A1','DOMINGO, MARY ANN',{dept:'APAC_ADMIN'}),labour('M1','CRUZ, BEN',{dept:'MAINTENANCE'}),office('S1','SPECIAL, ONE',{dept:'APAC_ADMIN',schedStart:'09:00'})];
    setE(E);loadEmployees();
    const c=(t,id)=>computeStatusFromTimeIn(t,id);
    return {
      d510:c('05:10','D1').lateMinutes,d458:c('04:58','D1').status,
      ag605:c('06:05','AG').lateMinutes,ag600:c('06:00','AG').status,
      c750:c('07:50','C1').status,c801:c('08:01','C1').lateMinutes,
      ed700:c('07:00','ED').status,ed701:c('07:01','ED').lateMinutes,
      p650:c('06:50','P1').status,a730:c('07:30','A1').lateMinutes,
      mEnd:hnxWorkSchedule('M1').end,dGroup:hnxWorkSchedule('D1').group,
      s900:c('09:00','S1').status,s859:c('08:59','S1').status,s901:c('09:01','S1').lateMinutes,
      noEmp:c('07:01').lateMinutes
    };},
  expect:{d510:10,d458:'present',ag605:5,ag600:'present',c750:'present',c801:1,ed700:'present',ed701:1,p650:'present',a730:30,mEnd:'17:30',dGroup:'Drivers & Helpers',s900:'present',s859:'present',s901:1,noEmp:1} }
];
