/**
 * Based on Ext 3.4.0
 * �ع����룬�Ż��߼���ʵ�ֶ�λAPI����
 * @author Denis 2011.08.15
 */
(function(){
    var ApiPanel, DocPanel, MainPanel, api;
    //��дȫ������
    Ext.BLANK_IMAGE_URL = 'static/img/icon/s.gif';
    /*
     * APIĿ¼��
     */
    ApiPanel = function(){
        ApiPanel.superclass.constructor.call(this, {
            id: 'api-tree',
            region: 'center',
            header: false,
            rootVisible: false,
            border: false,
            lines: false,
            autoScroll: true,
            animate: false,
            loader: new Ext.tree.TreeLoader({
                preloadChildren: true,
                clearOnLoad: false
            }),
            root: new Ext.tree.AsyncTreeNode({
                text: 'ROOT',
                id: 'root',
                expanded: true,
                children: Docs.contents
            }),
            collapseFirst: false
        });
        
        this.getSelectionModel().on('beforeselect', function(sm, node){
            return node.isLeaf();
        });
    };
    
    Ext.extend(ApiPanel, Ext.tree.TreePanel, {
        /*
         * ��ʼ�����
         */
        initComponent: function(){
            this.hiddenPkgs = [];
            Ext.apply(this, {
                tbar: [' ', new Ext.app.FilterField({
                    id: 'txtFilter',
                    emptyText: 'Keywords...',
                    enableKeyEvents: true,
                    listeners: {
                        render: function(f){
                            this.filter = new Ext.tree.TreeFilter(this, {
                                clearBlank: true,
                                autoClear: true
                            });
                        },
                        keydown: {
                            fn: this.filterTree,
                            buffer: 350,
                            scope: this
                        },
                        scope: this
                    }
                }), '->', {
                    iconCls: 'icon-expand-all',
                    tooltip: 'Expand All',
                    handler: function(){
                        this.root.expand(true);
                    },
                    scope: this
                }, '-', {
                    iconCls: 'icon-collapse-all',
                    tooltip: 'Collapse All',
                    handler: function(){
                        this.root.collapse(true);
                    },
                    scope: this
                }],
                bbar: [' ', new Ext.form.Checkbox({
                    id: 'cbxTabs',
                    checked: true,
                    boxLabel: '���ñ�ǩ���'
                })]
            });
            ApiPanel.superclass.initComponent.call(this);
        },
        /*
         * �ؼ��ֹ������ṹ
         */
        filterTree: function(t, e){
            if (t.el.dom.value) 
                t.trigger.show();
            else 
                t.trigger.hide();
            var text = t.getValue();
            Ext.each(this.hiddenPkgs, function(n){
                n.ui.show();
            });
            if (!text) {
                this.filter.clear();
                this.collapseAll();
                return;
            }
            else 
                this.expandAll();
            
            var re = new RegExp(Ext.escapeRe(text), 'i');
            this.filter.filterBy(function(n){
                return !n.attributes.isClass || re.test(n.text);
            });
            
            // hide empty packages that weren't filtered
            this.hiddenPkgs = [];
            var me = this;
            this.root.cascade(function(n){
                if (!n.attributes.isClass && n.ui.ctNode.offsetHeight < 3) {
                    n.ui.hide();
                    me.hiddenPkgs.push(n);
                }
            });
        },
        /*
         * ��λ��ǰҳ��Ӧ�����ڵ�
         */
        selectClass: function(node){
            this.selectPath(node.getPath());
        }
    });
    
    
    DocPanel = Ext.extend(Ext.Panel, {
        autoScroll: true,
        
        initComponent: function(){
            var ps = this.cclass.split('.');
            Ext.apply(this, {
                tbar: ['->', {
                    text: '�¿���������',
                    handler: this.directLink,
                    scope: this,
                    iconCls: 'icon-fav'
                }]
            });
            DocPanel.superclass.initComponent.call(this);
        },
        /**
         * �¿���������
         * @update Denis 2011.08.15 ͨ����ȡnode��href����ƴ���ַ���
         */
        directLink: function(){
            var href = api.getSelectionModel().selNode.attributes.href;
			var url;
			if(/^((https|http)?:)/.test(href)){
				url = href;
			} else {
				url = location.protocol + '//' + location.host + location.pathname + href;
			}
			
            window.open(url, '_blank');
        }
    });
    
    /*
     * �������ǩҳ
     */
    MainPanel = function(){
        MainPanel.superclass.constructor.call(this, {
            id: 'center',
            region: 'center',
            margins: '4 4 4 0',
            resizeTabs: true,
            minTabWidth: 135,
            tabWidth: 135,
            plugins: new Ext.ux.TabCloseMenu(),
            enableTabScroll: true
        });
    };
    
    Ext.extend(MainPanel, Ext.TabPanel, {
        /*
         * ��ʼ����ǩҳ�¼�
         */
        initEvents: function(){
            MainPanel.superclass.initEvents.call(this);
            //ADD:monitor title dbclick  
            this.mon(this.strip, 'dblclick', this.onTitleDbClick, this);
        },
        //ADD: handler  
        onTitleDbClick: function(e, target, o){
            var t = this.findTargets(e);
            if (t.item.closable && t.item.fireEvent('beforeclose', t.item) !== false) {
                t.item.fireEvent('close', t.item);
                this.remove(t.item);
            }
        },
        /*
         * �����ĵ�
         */
        loadClass: function(node){
            var cbxTabs = Ext.getCmp('cbxTabs'), isTabs = cbxTabs.getValue(), id = 'fd-' + node.id;
            if (!isTabs) {
                id = 'fd-home';
            }
            var tab = this.getComponent(id), split = window.location.href.split('#');
            window.location.href = split[0] + '#' + node.id;
            if (tab) {
                if (!isTabs) {
                    tab.el.dom.id = id;
                    tab.setTitle(node.attributes.text);
                    tab.setIconClass(node.attributes.iconCls);
                    tab.body.dom.innerHTML = String.format('<iframe frameborder="0" src="{0}?t={1}"></iframe>', node.attributes.href, new Date().valueOf());
                    //api.selectClass(node);
                }
                this.setActiveTab(tab);
            }
            else {
                var p = this.add(new DocPanel({
                    id: id,
                    title: node.attributes.text,
                    cclass: node.id,
                    html: String.format('<iframe frameborder="0" scrolling="yes" src="{0}?t={1}"></iframe>', node.attributes.href, new Date().valueOf()),
                    closable: id == 'fd-home' ? false : true,
                    autoScroll: false,
                    iconCls: node.attributes.iconCls
                }));
                this.setActiveTab(p);
            }
            api.selectClass(node);
        }
    });
    
    Ext.onReady(function(){
        var viewport, mainPanel, isTabs;
        //��ʼ��Tips
        Ext.QuickTips.init();
        api = new ApiPanel();
//        logo = new Ext.BoxComponent({
//            region: 'north',
//            html: '<div id="logo"><h1><a title="����Ͱ�����վǰ�˻������" href="#">FDEV - Library</a></h1></div>'
//        });
        mainPanel = new MainPanel();
        
        api.on('click', function(node, e){
            if (node.isLeaf()) {
                e.stopEvent();
                mainPanel.loadClass(node);
            }
        });
        /*
         * �Ӵ�
         */
        viewport = new Ext.Viewport({
            layout: 'border',
            items: [{
                region: 'north',
                contentEl: 'header',
                autoHeight: true,
                border: false,
                cls: 'header',
                margins: '0 0 0 0'
            }, {
                layout: 'border',
                id: 'west',
                region: 'west',
                split: true,
                header: false,
                width: 210,
                minSize: 210,
                maxSize: 210,
                collapsible: true,
                margins: '4 0 4 4',
                cmargins: '0 0 0 0',
                lines: false,
                animCollapse: false,
                animate: false,
                collapseMode: 'mini',
                collapseFirst: false,
                items: api
            }, mainPanel]
        });
        viewport.doLayout();
        //change with tree synchronism
        mainPanel.on('tabchange', function(tp, tab){
            var node = api.getNodeById(tab.cclass);
            if (node) {
                api.selectClass(node);
            }
        });
        //init checkbox
        var cbxTabs = Ext.getCmp('cbxTabs');
        isTabs = Ext.util.Cookies.get('ext-istabs') == 'false' ? false : true;
        cbxTabs.setValue(isTabs);
        cbxTabs.on('check', function(f, n, o){
            var now = new Date();
            now.setFullYear(now.getFullYear() + 1);
            Ext.util.Cookies.set('ext-istabs', n, now);
        });
        // allow for link in
        var split = window.location.href.split('#'), cls = 'home', node;
        if (split.length > 1) {
            cls = split[1];
        }
        node = api.getNodeById(cls);
        if (isTabs) {
            var homeNode = api.getNodeById('home');
            mainPanel.loadClass(homeNode);
        }
        if (node) {
            mainPanel.loadClass(node);
        }
        
        Ext.get('loading').fadeOut({
            remove: true
        });
        Ext.getCmp('txtFilter').focus();
    });
    /*
     * ��չ���˿�
     */
    Ext.app.FilterField = Ext.extend(Ext.form.TriggerField, {
        initComponent: function(){
            Ext.app.FilterField.superclass.initComponent.call(this);
        },
        triggerClass: 'x-form-clear-trigger',
        hideTrigger: true,
        validationEvent: false,
        validateOnBlur: false,
        
        onTriggerClick: function(){
            this.el.dom.value = '';
            this.trigger.hide();
            this.focus();
            this.fireEvent('keydown', this);
        }
    });
})();
