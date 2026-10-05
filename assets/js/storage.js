const DB = {
  key: 'katos_agenda_db_v1',
  defaults(){
    return {
      users: [],
      currentUserId: null,
      appointments: [],
      clients: [],
      professionals: [],
      tickets: [],
      services: [
        {id:'s1',name:'Corte',price:40},
        {id:'s2',name:'Barba',price:25},
        {id:'s3',name:'Corte + barba',price:60}
      ]
    };
  },
  read(){
    const raw = localStorage.getItem(this.key);
    if(!raw){ const d=this.defaults(); this.write(d); return d; }
    try{return JSON.parse(raw)}catch{const d=this.defaults();this.write(d);return d}
  },
  write(data){ localStorage.setItem(this.key, JSON.stringify(data)); },
  uid(prefix='id'){ return prefix+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
};
