// auth.js - система для мессенджера

class MessengerSystem {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
    }

    // Упрощенная регистрация (без email)
    register(username, password) {
        const users = this.getUsers();
        
        if (users.find(user => user.username === username)) {
            throw new Error('Пользователь с таким именем уже существует');
        }

        const newUser = {
            id: Date.now().toString(),
            username: username,
            password: password,
            registeredAt: new Date().toISOString(),
            profile: {
                bio: 'Привет! Я новый пользователь этого мессенджера!',
                avatar: '👤',
                status: 'online',
                lastSeen: new Date().toISOString()
            },
            contacts: [],
            blockedUsers: []
        };

        users.push(newUser);
        this.saveUsers(users);
        this.login(username, password);
        
        return newUser;
    }

    // Вход в систему
    login(username, password) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            throw new Error('Неверное имя пользователя или пароль');
        }

        // Обновляем статус
        user.profile.status = 'online';
        user.profile.lastSeen = new Date().toISOString();
        this.saveUsers(users);

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.updateNavigation();
        
        return user;
    }

    // Выход из системы
    logout() {
        if (this.currentUser) {
            // Устанавливаем статус "не в сети"
            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].profile.status = 'offline';
                users[userIndex].profile.lastSeen = new Date().toISOString();
                this.saveUsers(users);
            }
        }
        
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateNavigation();
        window.location.href = 'index.html';
    }

    // Обновление профиля
    updateProfile(profileData) {
        if (!this.currentUser) return;
        
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].profile = { ...users[userIndex].profile, ...profileData };
            this.currentUser = users[userIndex];
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.saveUsers(users);
        }
    }

    // Получение всех пользователей
    getAllUsers() {
        return this.getUsers().filter(user => user.id !== this.currentUser?.id);
    }

    // Поиск пользователей
    searchUsers(query) {
        const users = this.getAllUsers();
        return users.filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.profile.bio.toLowerCase().includes(query.toLowerCase())
        );
    }

    // ===== ФУНКЦИИ МЕССЕНДЖЕРА =====

    // Отправка сообщения
    sendMessage(chatId, text, type = 'text') {
        const messages = this.getMessages();
        const newMessage = {
            id: Date.now().toString(),
            chatId: chatId,
            from: this.currentUser.id,
            text: text,
            type: type,
            timestamp: new Date().toISOString(),
            read: false,
            reactions: []
        };
        
        messages.push(newMessage);
        localStorage.setItem('messages', JSON.stringify(messages));
        
        // Обновляем последнее сообщение в чате
        this.updateChatLastMessage(chatId, text);
        
        return newMessage;
    }

    // Получение сообщений чата
    getChatMessages(chatId) {
        const messages = this.getMessages();
        return messages
            .filter(msg => msg.chatId === chatId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    // Создание личного чата
    createPrivateChat(userId) {
        const chats = this.getChats();
        const existingChat = chats.find(chat => 
            chat.type === 'private' && 
            chat.participants.includes(userId) && 
            chat.participants.includes(this.currentUser.id)
        );
        
        if (existingChat) {
            return existingChat;
        }

        const newChat = {
            id: Date.now().toString(),
            type: 'private',
            participants: [this.currentUser.id, userId],
            createdAt: new Date().toISOString(),
            lastMessage: '',
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0
        };
        
        chats.push(newChat);
        localStorage.setItem('chats', JSON.stringify(chats));
        
        return newChat;
    }

    // Создание группы
    createGroup(name, description, participants = []) {
        const chats = this.getChats();
        const newChat = {
            id: Date.now().toString(),
            type: 'group',
            name: name,
            description: description,
            creator: this.currentUser.id,
            participants: [this.currentUser.id, ...participants],
            admins: [this.currentUser.id],
            createdAt: new Date().toISOString(),
            lastMessage: '',
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0
        };
        
        chats.push(newChat);
        localStorage.setItem('chats', JSON.stringify(chats));
        
        return newChat;
    }

    // Получение всех чатов пользователя
    getUserChats() {
        const chats = this.getChats();
        return chats.filter(chat => 
            chat.participants.includes(this.currentUser.id)
        ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    }

    // Обновление последнего сообщения в чате
    updateChatLastMessage(chatId, message) {
        const chats = this.getChats();
        const chatIndex = chats.findIndex(chat => chat.id === chatId);
        
        if (chatIndex !== -1) {
            chats[chatIndex].lastMessage = message;
            chats[chatIndex].lastMessageTime = new Date().toISOString();
            localStorage.setItem('chats', JSON.stringify(chats));
        }
    }

    // Получение информации о чате
    getChatInfo(chatId) {
        const chats = this.getChats();
        const chat = chats.find(c => c.id === chatId);
        
        if (!chat) return null;
        
        if (chat.type === 'private') {
            const otherUserId = chat.participants.find(id => id !== this.currentUser.id);
            const user = this.getUserById(otherUserId);
            return {
                ...chat,
                title: user.username,
                avatar: user.profile.avatar,
                status: user.profile.status
            };
        } else {
            return {
                ...chat,
                title: chat.name,
                avatar: '👥',
                status: `${chat.participants.length} участников`
            };
        }
    }

    // Добавление реакции к сообщению
    addReaction(messageId, reaction) {
        const messages = this.getMessages();
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        
        if (messageIndex !== -1) {
            if (!messages[messageIndex].reactions) {
                messages[messageIndex].reactions = [];
            }
            
            // Убираем предыдущую реакцию этого пользователя
            messages[messageIndex].reactions = messages[messageIndex].reactions.filter(
                r => r.userId !== this.currentUser.id
            );
            
            // Добавляем новую реакцию
            messages[messageIndex].reactions.push({
                userId: this.currentUser.id,
                reaction: reaction,
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('messages', JSON.stringify(messages));
        }
    }

    // Получение пользователя по ID
    getUserById(userId) {
        return this.getUsers().find(user => user.id === userId);
    }

    // ===== СЛУЖЕБНЫЕ ФУНКЦИИ =====

    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
        this.updateNavigation();
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    }

    getMessages() {
        return JSON.parse(localStorage.getItem('messages') || '[]');
    }

    getChats() {
        return JSON.parse(localStorage.getItem('chats') || '[]');
    }

    updateNavigation() {
        const profileLink = document.getElementById('profileLink');
        const authLinks = document.getElementById('authLinks');
        
        if (profileLink && authLinks) {
            if (this.currentUser) {
                profileLink.style.display = 'block';
                authLinks.style.display = 'none';
                profileLink.innerHTML = `
                    <a href="profile.html">👤 ${this.currentUser.username}</a>
                    <a href="chats.html">💬 Чаты</a>
                    <a href="contacts.html">👥 Контакты</a>
                `;
            } else {
                profileLink.style.display = 'none';
                authLinks.style.display = 'block';
            }
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Создаём глобальный экземпляр системы
const messenger = new MessengerSystem();