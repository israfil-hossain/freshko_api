const defaultCategories = [
    {
        name: 'Organic Veggies',
        image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=600&q=80',
        subcategories: [
            { name: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80' },
            { name: 'Root Vegetables', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80' },
            { name: 'Seasonal Veggies', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
        ],
    },
    {
        name: 'Fresh Fruits',
        image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
        subcategories: [
            { name: 'Citrus Fruits', image: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=600&q=80' },
            { name: 'Berries', image: 'https://images.unsplash.com/photo-1563746098251-d35aef196e83?auto=format&fit=crop&w=600&q=80' },
            { name: 'Tropical Fruits', image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?auto=format&fit=crop&w=600&q=80' },
            { name: 'Apples & Pears', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=600&q=80' },
        ],
    },
    {
        name: 'Cold Drinks',
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80',
        subcategories: [
            { name: 'Soft Drinks', image: 'https://images.unsplash.com/photo-1593364902223-4e56da4e3624?auto=format&fit=crop&w=600&q=80' },
            { name: 'Juices', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80' },
            { name: 'Energy Drinks', image: 'https://images.unsplash.com/photo-1629203851122-3726ec8cb81d?auto=format&fit=crop&w=600&q=80' },
        ],
    },
    {
        name: 'Instant Food',
        image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=600&q=80',
        subcategories: [
            { name: 'Noodles & Pasta', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80' },
            { name: 'Canned Food', image: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=600&q=80' },
            { name: 'Frozen Meals', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80' },
        ],
    },
    {
        name: 'Dairy Products',
        image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80',
        subcategories: [
            { name: 'Milk', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80' },
            { name: 'Cheese', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80' },
            { name: 'Yogurt', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' },
            { name: 'Butter & Cream', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80' },
        ],
    },
    {
        name: 'Bakery & Breads',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
        subcategories: [
            { name: 'Fresh Bread', image: 'https://images.unsplash.com/photo-1549931319-a545753467ee?auto=format&fit=crop&w=600&q=80' },
            { name: 'Cakes & Pastries', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
            { name: 'Cookies & Biscuits', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80' },
        ],
    },
    {
        name: 'Grains & Cereals',
        image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80',
        subcategories: [
            { name: 'Rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
            { name: 'Flour & Atta', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
            { name: 'Oats & Muesli', image: 'https://images.unsplash.com/photo-1590624874824-c4d0ff7bcd12?auto=format&fit=crop&w=600&q=80' },
            { name: 'Lentils & Pulses', image: 'https://images.unsplash.com/photo-1515543904379-3d757f87939d?auto=format&fit=crop&w=600&q=80' },
        ],
    },
];

export default defaultCategories;
