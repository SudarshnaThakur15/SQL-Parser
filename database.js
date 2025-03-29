const mockDB = {
    "sales": ["id", "amount", "date"],
    "customers": ["id", "name", "email"],
    "products": ["id", "name", "price", "category"],
    "orders": ["id", "customer_id", "product_id", "quantity", "order_date"],
    "employees": ["id", "name", "department", "salary"],
    "departments": ["id", "name", "budget"]
};



module.exports = { mockDB};
