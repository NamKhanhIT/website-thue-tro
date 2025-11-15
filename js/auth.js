// Simple client-side auth for demo only (localStorage)
// Provides register, login, logout, getCurrentUser, and navbar init
(function(window){
  'use strict';

  function toHex(buffer){
    var hex = '';
    var view = new Uint8Array(buffer);
    for(var i=0;i<view.length;i++){
      var h = view[i].toString(16);
      if(h.length===1) h = '0'+h;
      hex += h;
    }
    return hex;
  }

  async function hashPassword(password){
    if(!window.crypto || !window.crypto.subtle) return password; // fallback - plaintext (not secure)
    var enc = new TextEncoder();
    var data = enc.encode(password);
    var hash = await window.crypto.subtle.digest('SHA-256', data);
    return toHex(hash);
  }

  function getUsers(){
    try{ return JSON.parse(localStorage.getItem('sr_users')||'[]'); }catch(e){return []}
  }
  function saveUsers(users){ localStorage.setItem('sr_users', JSON.stringify(users)); }

  function getCurrentUser(){
    var id = localStorage.getItem('sr_current');
    if(!id) return null;
    var users = getUsers();
    return users.find(u=>u.id===id) || null;
  }

  async function registerUser(name,email,password){
    if(!email || !password) return {success:false,message:'Email và mật khẩu là bắt buộc.'};
    var users = getUsers();
    if(users.find(u=>u.email.toLowerCase()===email.toLowerCase())) return {success:false,message:'Email đã được sử dụng.'};
    var pwHash = await hashPassword(password);
    var id = 'u'+Date.now();
    users.push({id:id,name:name||email.split('@')[0],email:email.toLowerCase(),passwordHash:pwHash});
    saveUsers(users);
    localStorage.setItem('sr_current', id);
    return {success:true,message:'Đăng ký thành công',userId:id};
  }

  async function loginUser(email,password){
    if(!email || !password) return {success:false,message:'Email và mật khẩu là bắt buộc.'};
    var users = getUsers();
    var u = users.find(u=>u.email.toLowerCase()===email.toLowerCase());
    if(!u) return {success:false,message:'Không tìm thấy tài khoản với email này.'};
    var pwHash = await hashPassword(password);
    if(pwHash !== u.passwordHash) return {success:false,message:'Mật khẩu không đúng.'};
    localStorage.setItem('sr_current', u.id);
    return {success:true,message:'Đăng nhập thành công',userId:u.id};
  }

  function logout(){ localStorage.removeItem('sr_current'); }

  // DOM helpers
  function showMessage(container, msg, type){
    var t = type||'info';
    var html = '<div class="alert alert-'+t+'">'+msg+'</div>';
    $(container).find('.auth-msg').remove();
    $(container).prepend('<div class="auth-msg">'+html+'</div>');
  }

  function initNavbar(){
    $(function(){
      var current = getCurrentUser();
      if(current){
        $('#nav-login, #nav-register').addClass('d-none');
        $('#nav-user').removeClass('d-none');
        $('#nav-username').text(current.name || current.email);
      } else {
        $('#nav-login, #nav-register').removeClass('d-none');
        $('#nav-user').addClass('d-none');
      }

      $('#nav-logout').on('click', function(e){ e.preventDefault(); logout(); initNavbar(); window.location.reload(); });
    });
  }

  // Hook up login/register forms if present
  $(function(){
    initNavbar();

    var $reg = $('#register-form');
    if($reg.length){
      $reg.on('submit', async function(e){
        e.preventDefault();
        var name = $('#reg-name').val().trim();
        var email = $('#reg-email').val().trim();
        var pass = $('#reg-password').val();
        var pass2 = $('#reg-password2').val();
        if(pass !== pass2){ showMessage($reg, 'Mật khẩu không khớp', 'danger'); return; }
        showMessage($reg, 'Đang đăng ký...','info');
        var res = await registerUser(name,email,pass);
        if(res.success){ showMessage($reg, res.message, 'success'); setTimeout(function(){ window.location.href = 'index.html'; },800); }
        else showMessage($reg, res.message, 'danger');
      });
    }

    var $login = $('#login-form');
    if($login.length){
      $login.on('submit', async function(e){
        e.preventDefault();
        var email = $('#login-email').val().trim();
        var pass = $('#login-password').val();
        showMessage($login, 'Đang đăng nhập...','info');
        var res = await loginUser(email,pass);
        if(res.success){ showMessage($login, res.message, 'success'); setTimeout(function(){ window.location.href = 'index.html'; },600); }
        else showMessage($login, res.message, 'danger');
      });
    }
  });

  // expose for console
  window.SRAuth = { registerUser, loginUser, logout, getCurrentUser, getUsers };

})(window);
