/*
	表单组件库
	@baukh20150302:带树级状态的可搜索下拉框
	@baukh20150424:性能全面优化，提升前端渲染及事件处理速度
*/
'use strict';
select3.prototype = {
	constructor: select3
	/*
		//选中树节点
		//$.选中的节点数据
	*/
	,checkNode: function(_dom, data){
		var _this = this;
		if(!data){
			return false;
		}
		var _dom = $(_dom),   //原生的dom节点
			_choiceDOM = _dom.parent().find('.'+ _this.domMark),//生成后的dom节点
			_titleList  = _choiceDOM.find('.ts-title');	//所有的选项名称dom节点
		var _nodeId,	//当前的节点标识
			_node;		//节点
		
		//清除缓存		
		var _choiceField = _choiceDOM.find('.choice-field');
		_dom.val('');
		_dom.data('choiceData',[]);
		if(_choiceField.length > 0){
			_choiceField.find('.del-action').trigger('click');
		}
		if(data.length == 0){
			return false;
		}
		//通过参数配置数据
		$.each(data, function(i, v){
			//类型为对象时
			if(typeof(v) == 'object'){ 
				_nodeId = v.id;
			}
			//类型为字符串或数字时
			if(typeof(v) == 'string' || typeof(v) == 'number'){
				_nodeId = v;
			}
			_node = $('[node-id="'+ _nodeId +'"]', _choiceDOM);
			if(_node && _node.length > 0){
				_node.trigger('click', ['open']);
			}
		});
		
	}
	/*
		@绑定选择框事件:
		1、打开树/关闭列表事件
		2、关闭下拉列表
		3、树列表的选中事件
		4、展示列表的取消选中事件
		5、搜索事件
	*/
	,bindChoiceEvent: function(){
		var _this = this;
		/***
			鼠标事件
		*/
		var	_thisDOM,			//当前生成DOM在大容器
			_list,				//选择列表
			_memory,			//存储器
			_memoryArray,		//存储器内的值[数组]
			_choicesArea,		//选中列表与搜索区域
			_choicesList,		//选中列表与搜索区域所在的ul
			_choiceField,   	//选中列表
			_searchBox,		    //输入区域
			_searchField,		//搜索区域
			_remindArea,    	//提示区域
			_iconLoading,		//loading图标区域
			_showHtml = '', 	//当前选中需生成的HTML片段
			_delAction,			//当前取消选择事件源
			_delForLi,			//当前事件源所在展示列
			_nodeId,			//当前事件所对应的ID值	
			_treeArea;			//搜索结果所在区域
		//1、打开下拉列表事件
		$('.'+ _this.domMark).off('click', '.choices-list, .search-input');
		$('.'+ _this.domMark).on('click', '.choices-list, .search-input', function(e){
			if(e.target != this){
				return false;
			}	
			_this.outLog('select3:打开下拉列表事件');
			_thisDOM = $(this).parents('.'+ _this.domMark).eq(0);
			_choicesArea = _thisDOM.find('.choices-area');
			_searchBox = _thisDOM.find('.search_box');
			_choicesList 	= _thisDOM.find('.choices-list');
			_treeArea = _thisDOM.find('.tree-area');
			_searchField 	= _searchBox.find('.search-field');
						
			//打开
			if(!_thisDOM.hasClass('fc-doing')){
				/*var _w  = _choicesList.width()
						- _searchField.get(0).offsetLeft
						- 2;					
				_searchField.width(_w);*/
				_searchBox.css({display:'block'});
				_thisDOM.addClass('fc-doing');
				_treeArea.fadeIn(_this.animateTime)
				_searchField.find('input').focus();
			}
		});
		
		//2、关闭下拉列表
		$('body').bind('click', function(e){
			//当前处于点击源处于插件DOM节点内时，不进行关闭操作，
			//但在search-input中存在关闭操作，在打开/关闭下拉列表事件源中声明
			if(!$(e.target).hasClass(_this.domMark) && $(e.target).parents('.' + _this.domMark).length != 0){
				return;
			}
			_thisDOM = $('.'+ _this.domMark);
			_treeArea = _thisDOM.find('.tree-area:visible');
			var _visibleDOM = _treeArea.parents('.'+ _this.domMark);
			_choicesList 	= _visibleDOM.find('.choices-list');
			_searchField 	= _visibleDOM.find('.search-field');
			_searchBox 	= _visibleDOM.find('.search_box');
			_searchBox.css({
				display:'none'
			});
			
			if(_visibleDOM.length == 0){
				return;
			}
			_this.outLog('select3:关闭下拉列表');
			
			//清空搜索内容及搜索结果
			_searchField.find('input').val('');
			_searchField.find('input').trigger('keyup');			
			
			//移除class标识、关闭搜索结果区、更改搜索输入框最小值
			_thisDOM.removeClass('fc-doing');
			_treeArea.hide();
			_searchField.width(_this.searchMinWidth);
			
			//清除提示内容
			_remindArea  = _thisDOM.find('.remind-area');
			var _remindText = _remindArea.find('.remind-text');
			_remindText.text('');
			_remindText.hide()
		});
		
		//3、选中事件
		var _choicesAction,	//选中事件源
			_title,			//标题选中事件源
			_icon;			//图标选中事件源
		$('.'+ _this.domMark).off('click', '.choices-action');
		$('.'+ _this.domMark).on('click', '.choices-action', function(e, _action_){
			_choicesAction = $(this);
			if(_choicesAction.hasClass('ts-icon')){
				_icon = _choicesAction;
				_title = _icon.parent().find('> .ts-title');
			}else{
				_title = _choicesAction;	
				_icon = _title.parent().find('> .ts-icon:visible');
			}
			// 已选中
			if(_title.hasClass('is-checked')){
				return false;
			}
			_this.outLog('select3:选中事件');
			
			_thisDOM		= _title.parents('.'+ _this.domMark).eq(0);
			_list			= _title.parent().find('> .list-element');		
			_memory 		= _thisDOM.parent().find('[select3-id="tas_' + _thisDOM.attr('tas')+'"]');
			_choicesArea = _thisDOM.find('.choices-area');
			_choicesList 	= _thisDOM.find('.choices-list');
			_searchField 	= _choicesList.find('.search-field');				
			

			//切换小图标样式
			//展示或隐藏子集列表
			if(_icon && _icon.hasClass('icon-right-s1') || _action_ == 'open'){
				_icon.removeClass('icon-right-s1');
				_icon.addClass('icon-down-s1');
				_list.slideDown(_this.animateTime);
			}else{
				_icon.addClass('icon-right-s1');
				_icon.removeClass('icon-down-s1');
				_list.slideUp(_this.animateTime);
			}


			//是否多选
			console.log(_this);
			if(!_this.isMultiple && _memory.val().length>0){
				return; 
			}

			//当前无子节点 或 用户配置父级节点可选
			if(_list.length == 0 || _this.isSelectParent){
				//存储ID至原生节点
				_nodeId = _title.attr('node-id');
				var _tmpVal = _memory.val() 
							+ ($.trim(_memory.val()) == '' ? '' : ',')
							+ _nodeId;		

				_memory.val(_tmpVal);
				
				//存储对象至原生节点
				var _tmpData = _memory.data('choiceData') || [];
				_tmpData.push({
					id	: _nodeId,
					name:_title.attr('title')
				});

				_memory.data('choiceData',_tmpData);
				
				//存储name至展示区域
				_showHtml = '<li class="choice-field" node-id="'+ _title.attr('node-id') +'">'
						  + '<span class="show-text" title="'+ _title.text() +'">'
						  + _title.text()
						  + '</span>'
						  + '<span class="del-action icon-delete-s1"></span>'
						  + '</li>';
				_searchField.before(_showHtml);
				
				//将已选中的子集增加不可选状态
				_title.addClass('is-checked');

				//重置搜索输入框				
				/*_searchField.width(_this.searchMinWidth);
				var _w  = _choicesList.width()
						- _searchField.get(0).offsetLeft
						- 2;
				_searchField.width(_w);*/

				//是否多选
				if(!_this.isMultiple){
					$('body').trigger('click');
				}
			}

		});
		
		//4、取消选中事件:鼠标关闭事件触发
		$('.'+ _this.domMark).off('click', '.del-action');
		$('.'+ _this.domMark).on('click', '.del-action', function(){
			_delAction = $(this);
			_delForLi = _delAction.parent();
			_nodeId = _delForLi.attr('node-id');		
			_this.outLog('select3:鼠标关闭事件触发');
			//移除存储数据	:val
			_thisDOM= _delAction.parents('.'+ _this.domMark).eq(0);
            _choicesList 	= _thisDOM.find('.choices-list');
            _searchField 	= _choicesList.find('.search-field');
            _memory = _thisDOM.parent().find('[select3-id="tas_' + _thisDOM.attr('tas')+'"]');
			_memoryArray = _memory.val().split(',');
			$.inArray(_nodeId, _memoryArray) == -1 ? '' : _memoryArray.splice($.inArray(_nodeId, _memoryArray), 1);
			_memory.val(_memoryArray.join(','));
			
			//移除存储数据	:data
			var _tmpData = _memory.data('choiceData') || [];
			
			$.each(_tmpData, function(i, node){
				if(node.id == _nodeId){
					_tmpData.splice(i, 1);
					return false;
				}
			});
			_memory.data('choiceData',_tmpData);
						
			$('[node-id="'+_nodeId+'"]', _thisDOM).removeClass('is-checked');
						
			//清除展示
			_delForLi.remove();
			
			//重置搜索输入框				
			_searchField.width(_this.searchMinWidth);
			var _w  = _choicesList.width()
					- _searchField.get(0).offsetLeft
					- 2;
			_searchField.width(_w);
		});
		
		/***
			键盘事件
		****/
		var _searchAction,	//搜索事件源
			_searchText,	//搜索文本
			_titleList,		//搜索匹配结果列表
			_onlyTitle,		//单个匹配结果
			_onlyTitleText,	//单个匹配结果文本
			_indexOfNum,	//搜索文本在单个匹配结果的位置
			_delActionList; //删除事件源列表
		
		//5、取消选中事件:键盘回退事件触发
		$('.'+ _this.domMark).off('keydown', '.search-input');
		$('.'+ _this.domMark).on('keydown', '.search-input', function(e){	
			_searchAction 	= $(this);
			_searchText 	= $.trim(_searchAction.val());
			//键盘回退键导向取消选中功能
			if(_searchText.length == 0 && e.keyCode === 8){
				_this.outLog('select3:键盘回退事件触发');
				_thisDOM 		= _searchAction.parents('.'+ _this.domMark).eq(0);
				_choicesArea 	= _thisDOM.find('.choices-area');
				_treeArea 		= _thisDOM.find('.tree-area');
				_titleList 		= _treeArea.find('.ts-title');
				_delActionList = _choicesArea.find('.del-action');
				_delActionList.length != 0 ? _delActionList.eq(_delActionList.length - 1).trigger('click') : '';
				return false;
			}
		});
		
		//6、搜索事件
		var STO_search;
		$('.'+ _this.domMark).off('keyup', '.search-input');
		$('.'+ _this.domMark).on('keyup', '.search-input', function(e){
			_searchAction 	= $(this);
			_thisDOM 		= _searchAction.parents('.'+ _this.domMark).eq(0);
			_choicesArea 	= _thisDOM.find('.choices-area');
			_remindArea  	= _thisDOM.find('.remind-area');
			_treeArea 		= _thisDOM.find('.tree-area');
			_titleList 		= _treeArea.find('.ts-title');
			_searchText 	= $.trim(_searchAction.val());
			_iconLoading 	= _choicesArea.find('.icon-loading');
			
			var _remindText = _remindArea.find('.remind-text');
			_remindText.text('');
			_remindText.hide();
			//验证搜索条件是否重复			
			if(_searchText == _searchAction.attr('record')){				
				return false;
			}
			_this.outLog('select3:搜索事件');
			
			//验证当前是否存在可进行匹配的数据
			if(!_titleList || _titleList.length == 0){
				_remindText.text('匹配结果为空...');
				_remindText.show()
				return false;
			}		
			_searchAction.attr('record', _searchText);
			
			//若当前搜索文本为空字符串，那么直接显示全部，不再进行全局搜索
			if(_searchText == ''){
				//清除匹配文本样式
				$.each($('.search-text'), function(i, v){
					_onlyTitle = $(this).parent();
					_onlyTitle.html(_onlyTitle.text());
				});
				_thisDOM.find('.list-element li').show();
				return false;
			}
			if(_iconLoading.css('display') != 'none'){
				window.clearTimeout(STO_search);
			}
			_iconLoading.show();	
			_thisDOM.find('.list-element li').hide();
			
			var matchNum = 0;
			eachTitleList(_titleList);	
			//循环处理标题列表：该方法为解决搜索量过大造成的性能问题
			function eachTitleList(_list_){	
				$.each(_list_, function(i, v){
					if(i > _this.matchLimit){
						window.clearTimeout(STO_search);
						STO_search = window.setTimeout(function(){
							eachTitleList(_list_.splice(_this.matchLimit));
						},_this.matchTime);	
						return false;
					}	
					_onlyTitle = $(v);
					if(_onlyTitle.parent().find('.list-element').length > 0){
						return true;
					}
					_onlyTitleText = _onlyTitle.text();
					_indexOfNum = _onlyTitleText.indexOf(_searchText);
					if(_indexOfNum != -1){
						matchNum++;
						_onlyTitle.html(
							_onlyTitleText.slice(0,_indexOfNum)
							+ '<span class="search-text">'
							+ _searchText
							+ '</span>'
							+ _onlyTitleText.slice(_indexOfNum + _searchText.length)
						);
						_onlyTitle.parents('li').eq(0).show();  //展示标题所在的li
						showParent(_onlyTitle);
					}
				});
				//递归搜索结束时
				if(_list_.length < _this.matchLimit){
					_iconLoading.hide();
					if(matchNum == 0){
						_remindText.text('匹配结果为空...');
						_remindText.show();
					}
				}
			}
			var _pId,
				_pDOM;
			//展示当前匹配搜索条件的父级
			function showParent(_t_){
				_pId = $(_t_).attr('p-id');
				if(_pId == undefined){
					return false;
				}
				_pDOM = $('[node-id="'+ _pId +'"]', _thisDOM);
				if(!_pDOM || _pDOM.length == 0 ){
					return false;
				}
				_pDOM.parent().show();
				_pDOM.trigger('click', ['open']);
				showParent(_pDOM);
			}
		});
	}
	/*
		@生成选择区域DOM
	*/
	,createDOM: function(dom){
		var _this = this;
		var _dom = $(dom);
		var _warpHtml = '<div class="tree-type-search '+ _this.domMark +'">'
					  + '<div class="choices-area">'
					  + '<i class="icon-loading icon-refresh-s1"></i>'
					  + '<ul class="choices-list">'
					  + '<li class="search-field"></li>'
					  + '</ul>'
					  + '</div>'
					  + '<div class="remind-area"><div class="remind-text"></div></div>'
					  + '<div class="search_box"><input type="text" class="search-input" record="" placeholder="'+_this.placeholder+'"/></div>'
					  + '<div class="tree-area">'
					  + '</div>'
					  + '</div>';
		var _warp,
			_choicesList;
			//生成树			  
		_warp = $(_warpHtml);
		_warp.css({
		//	width:v.get(0).offsetWidth - 2 //减去边框
			width: _this.width
		});
		_warp.attr('tas', _dom.attr("name") + '_' + _this.spanningOnly(_dom.attr("name")));
		_warp.find('.choices-area').css({
			//minHeight:v.get(0).offsetHeight - 2  //减去边框
			minHeight: _this.height
		});
		_warp.find('.icon-loading').css({
			right: '5px',
			top: ((_this.height.split('px')[0] - 14) / 2)  + 'px'
		});
		
		_this.spanningTree(_warp.find('.tree-area'));
		_dom.parent().append(_warp);
		
		//配置原生DOM节点
		_dom.attr('select3-id', 'tas_' + _dom.attr("name") + '_' + _this.spanningOnly(_dom.attr("name")));
		_dom.val('');
		_dom.hide();	
		
		//配置显示区域li的高度
		_choicesList = _warp.find('.choices-list');
		_choicesList.css({
			minHeight : _this.height, 
			lineHeight : (_this.height.split('px')[0] - 8) + 'px'	 //减去外边距			
		});		
		
	}
	/*
		@生成唯一标识
	*/
	,spanningOnly: function(_name_){
		return $('[name="'+ _name_ +'"]').index();
	}
	/*
		@生成树结构
	*/
	,spanningTree: function(treeDOM){
		var _this = this;
		var treeHtml = '';
		var layer = 0,			//记录层级，用于各层级的隔段样式
			isHaveSon = false;	//是否有子集
		spanning(_this.treeData, undefined);
		//生成方法
		function spanning(treeData, pId){
			treeHtml += '<ul class="list-element"'
					 + (layer != 0 ? ' style="display:none;"': '')
					 + '>';
			$.each(treeData, function(i, v){
				if(v.son && v.son.length > 0){
					isHaveSon = true;
				}else{
					isHaveSon = false;
				}
				
				treeHtml += '<li>';
				treeHtml += '<span class="ts-icon icon-right-s1 choices-action" style="width:'+ (layer+1) * _this.indent+'px;'
						 + (isHaveSon ? '' : 'display:none;')
						 + '"></span>'
					   	 +  '<span class="ts-title choices-action" style="padding-left:'
						 + (layer + 1) * _this.indent +'px" node-id="'+(v.id || v.name)+'" title="'+ v.name +'"'
						 + (pId != undefined ? 'p-id="'+ pId +'"' : '')
						 + '>'
						 + v.name 
						 +'</span>';
				if(isHaveSon){
					layer++;	
					spanning(v.son, (v.id || v.name));
					layer--;
				}
				treeHtml += '</li>';  
			});		
			treeHtml += '</ul>';
			treeDOM.html(treeHtml);
		}
	}
	/*
		@输出日志
	*/
	,outLog: function(msg){
		if(this.isDevelopMode){
			console.log(msg);
		}
	}
};
function select3(node, s1, s2){
	var setting = {};
	this.domMark			= 'tree-type-search';	//标识，用于生成下拉框
	this.treeData			= [];					//树源数据
	this.data				= [];					//选中的节点
	this.animateTime		= 300;					//滑动动画耗时
	this.indent     		= 26;					//树缩进像素
	this.isSelectParent 	= false; 				//是否可选中父级节点
	this.isMultiple        	= true;                //是否多选
	this.searchMinWidth 	= 20;					//搜索输入框最小宽度
	this.width				= '100%';				//控件展示宽度
	this.height				= '32px';				//控件展示高度
	this.matchLimit 		= 20;					//搜索时单次进行匹配的量，该值越大匹配越快，但是会影响性能，
	this.matchTime  		= 20;					//搜索时单次进行匹配的延时，该值越小匹配越快，但是会影响性能
	this.isDevelopMode     	= false;				//是否为开发模式，为true时将打印事件日志
	this.placeholder		= 'Please select a';	//选中项为空的占位符

	if(typeof(s1) == 'string' && !s2){
		throw new Error('select3参数错误，请参考使用文档');
		return false;
	}

	//数据格式:字符串
	if(s2 && typeof(s2) == 'string'){
		this.outLog('输入数据格式为字符串');
		s2 = s2.split(',');
		//数据格式：数字
	}else if(s2 && typeof(s2) == 'number'){
		this.outLog('输入数据格式为数字');
		s2 = [s2];
		//数据格式：对象
	}else if(s2 && $.isPlainObject(s2)){
		this.outLog('输入数据格式为对象');
		s2 = [s2];
		//数据格式：数组
	}else if(s2 && $.isArray(s2)){
		this.outLog('输入数据格式为数组');
		s2 = s2;
	}
	//当前数据类型为val:单一的
	if(typeof(s1) == 'string' && (s1 == 'val' || s1 == 'data')){
		this.data = s2;
	}

	//当前为渲染配置项
	if(typeof(s1) == 'object'){
		setting = s1;
	}
	$.extend(this, setting);
	//验证是否已经渲染
	if(node.parent().find('.' + this.domMark).length == 0){
		this.createDOM(node);//创建select3 DOM
		this.bindChoiceEvent(this); //绑定选择框事件
	}
	//数据回显
	this.checkNode(node, this.data);
}
(function(){
	//初始化插件
	//$.s1:为对像时,s2为空
	//$.s2:类型可以为string,Object,number,array
	$.fn.select3 = function(s1, s2){
		var sel = new select3(this, s1, s2);
	};
})();
