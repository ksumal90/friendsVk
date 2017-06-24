var template = `
<div class='div' id='{{id}}' draggable="true">
    <img class='photo' src = '{{photo}}'>
    <span class='nametext'>{{first_name}} {{last_name}}</span>
    <img class='plus' src='{{icon_photo}}'>
</div>
`;

function isMatching(full, chunk) {
    if (full.toLowerCase().indexOf(chunk.toLowerCase()) != -1) {
         return true;
     } 
     return false;
}

function render(array, container) {
    container.innerHTML='';
    array.forEach(function(friend) {
        var friendLi = document.createElement('li');//создаем li
        container.appendChild(friendLi);
        var data = {
            photo: friend.photo_200 || 'no-avatar.gif',
            first_name: friend.first_name,
            last_name: friend.last_name,
            icon_photo:'plus.png',
            id: friend.id
        }

        var templateFn = Handlebars.compile(template);
        var html = templateFn(data);
        friendLi.innerHTML = html;

        if(container.id == 'selectFriends'){
            var icons = selectFriends.querySelectorAll('.plus');
            icons.forEach(function(icon) {
                 icon.classList.add('delete');//меняем иконку
                 icon.classList.remove('plus');//меняем иконку
            });
        }
    });
}

function filter(friendsArray, chunk){
    var positiveArr = friendsArray.filter(function(friend) {
        return ((isMatching(friendsArray.last_name, chunk)) || (isMatching(friendsArray.first_name, chunk)));
    });
} 

//добавить элемент в один массив и удалить из другого
function refreshArrays(pushArray, deleteArray, selectElement) {
    for (var i=0; i<pushArray.length; i++) {
        if(selectElement.id == pushArray[i].id) {
            deleteArray.push(pushArray[i]);
            pushArray.splice(i, 1);
         }
    };
}
 
function find(array, valueInput, container) {//передаем массив, по которому осуществляется поиск, значение для поиска, и контейнер, куда вставляем полученный массив
    var findArray = [];
    array.forEach(function(friend) {
        if ((isMatching(friend.last_name, valueInput)) || (isMatching(friend.first_name, valueInput))) {//если есть совпадения в фамилии или имени
            findArray.push(friend);//добавляем элемент в массив findArray
        } 
    });
    render(findArray, container);//рендер полученного массива

} 

function moveOneElement(selectElement,arrayDelete,arrayPush,selectUl) {//передаем выбранный элемент div, массив из которого удаляем элемент, массив в который добавляем элемент, блок куда добавляем елемент
    var parentSelectElement = selectElement.parentElement;//выбранный li
    selectUl.appendChild(parentSelectElement);//перемещаем выбранный элемент в список selectFriends
    refreshArrays(arrayDelete,arrayPush,selectElement);
    for (var i=0; i<selectElement.children.length; i++){
        if (selectElement.children[i].className == 'plus'){
            selectElement.children[i].classList.add('delete');
            selectElement.children[i].classList.remove('plus');
        }
    }
}
new Promise(function(resolve,reject){
    window.addEventListener('load', function(){
        resolve();
    });
})
.then(function() {
    return new Promise(function(resolve,reject) {
        VK.init({
            apiId: 6058081
        });

        VK.Auth.login(function(response) {
            if (response.session){
                 resolve(response);
            }
            else {
               reject(new Error('Не удалось авторизоваться'));
            }
        }, 2);

    });
})
.then(function(){
    return new Promise(function(resolve,reject) {
        VK.api('friends.get', {v:'5.64', fields:'photo_200'}, function(response){
            if(response.error){
                reject(new Error('не удалось'));
            }
            else {
                resolve(response);
            }
        })
    });
})
.then(function(response){
    if(localStorage.length>0){
        var data = JSON.parse(localStorage.data || '{}');
        friendsArray = data.leftArray;
        selectArray = data.rightArray;
        render(friendsArray, allFriends);
        render(selectArray, selectFriends);
    } else{
        render(response.response.items, allFriends);
        var friendsArray = response.response.items;
        var selectArray=[];
    }
    document.addEventListener('click',function(e) {//переместить при помощи клика на плюс
        if((e.target.className == 'plus')||(e.target.className == 'delete')) {//если кликнули на иконку
            var el = e.target;
            var divElement = el.parentElement;
            if(divElement.parentElement.parentElement.id == 'allFriends') {//если находимся в списке allFriends
                //передаем выбранный элемент, массив из которого удаляем элемент, массив в который добавляем элемент, блок куда добавляем елемент
                moveOneElement(divElement,friendsArray,selectArray,selectFriends);  
            }
           else {
                if (divElement.parentElement.parentElement.id == 'selectFriends') {//если находимся в списке selectFriends
                    moveOneElement(divElement,selectArray,friendsArray,allFriends);
                }
           }
        }
    });
    var divFind = document.querySelector('.find');
    divFind.addEventListener('input', function(e) {
        if (e.target.id == 'inputLeft'){
            find(friendsArray, e.target.value, allFriends);
        }
        if (e.target.id == 'inputRight'){
            find(selectArray, e.target.value, selectFriends);
        }  
    });
    var buttonSave = document.querySelector('.save');
    buttonSave.addEventListener('click', function(e) {
        localStorage.data = JSON.stringify({
            leftArray: friendsArray,
            rightArray: selectArray
        });
        alert('Списки друзей сохранены');
    });

    function dragStart(ev) {
       ev.dataTransfer.effectAllowed='move';
       ev.dataTransfer.setData("Text", ev.target.getAttribute('id'));   
        return true;
    }   

    function dragEnter(ev) {
       event.preventDefault();
       return true;
    }

    function dragOver(ev) {
        event.preventDefault();
    }

    function dragDrop(ev) {
        var data = ev.dataTransfer.getData("Text");
        var selectEl = document.getElementById(data);
        moveOneElement(selectEl,friendsArray,selectArray,selectFriends);
    }
     
    selectFriends.addEventListener('dragenter', function(e){
        return dragEnter(event);
    });

    selectFriends.addEventListener('drop', function(e){
        return dragDrop(event);
    });

    selectFriends.addEventListener('dragover', function(e){
        return dragOver(event)
    });

    allFriends.addEventListener('dragenter', function(e){
        if((e.target.parentElement.className == 'div') || (e.target.className == 'div')){
            return dragEnter(event);
        }
        
    });

    allFriends.addEventListener('drop', function(e){
        if((e.target.parentElement.className == 'div') || (e.target.className == 'div')){
            return dragDrop(event);
        }
    });

    allFriends.addEventListener('dragover', function(e){
        if((e.target.parentElement.className == 'div') || (e.target.className == 'div')){
            return dragOver(event);
        }
    });

     allFriends.addEventListener('dragstart', function(e){
        if((e.target.parentElement.className == 'div') || (e.target.className == 'div')){
            return dragStart(event)
        }
     });
})
.catch(e => alert('Ошибка: ' + e.message));


