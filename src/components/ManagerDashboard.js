import React from 'react';
import { View, Text } from 'react-native';
import Branches from './Branches'; // Импортируем обновленный компонент

// В будущем здесь будет навигация с табами (вкладками)
const ManagerDashboard = () => {
    return (
        <View>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Manager Controls</Text>
            {/* Пока отображаем только компонент филиалов */}
            <Branches />
        </View>
    );
};

export default ManagerDashboard;
