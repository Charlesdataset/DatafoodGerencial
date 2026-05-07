

const CardDetail: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ marginRight: '1rem', fontSize: '1.5rem' }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '0.9rem', color: '#888' }}>{title}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{value}</div>
            </div>
        </div>
    );
};

export default CardDetail;