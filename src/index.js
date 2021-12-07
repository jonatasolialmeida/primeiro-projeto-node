const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = []; 

/**
 * cpf -string
 * name - string
 * id - uuiu inique universal identifier
 * statement []
 */

// MIDDLEWARE
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    // diferente do some, o find vai retornar o que tem dentro, e não faz verificação através de condição
    const customer = customers.find(customer => customer.cpf === cpf);

    // verificação se conta do usuário existe
    if(!customer) {
        return response.status(400).json({ error: "Customer not found" });
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount;
        }else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

//  o some faz uma busca no array passando um boolean de acordo com a condição que passarmos para ele    
    const customerAlreadyExists = customers.some(
        // abaixo a condição de vericação
        (customer) => customer.cpf === cpf
    );

    if(customerAlreadyExists) {
        return response.status(400).json({ error: "Customer already exists!" });
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });

    // Se der certo ele retorna um status 201
    return response.status(201).send();
});

//****************************** */
// NOformato abaixo foi feito passando params
// depois foi feito usando HEADERS

// app.get("/statement/:cpf", (request, response) => {
//     const { cpf } = request.params;

//     // diferente do some, o find vai retornar o que tem dentro, e não faz verificação através de condição
//     const customer = customers.find(customer => customer.cpf === cpf);

//     if(!customer) {
//         return response.status(400).json({ error: "Customer not found" });
//     }

//     return response.json(customer.statement);
// });

// outra forma/ para entender o conceito de middlewares
//  que se utiliza dos headers
//************************* */


// DUAS FORMAS DE USAR O MIDDLEWARE
// ******PRIMEIRA*****
// Nesse formato, tudo o que estiver abaixo do middleware
// vai passar por ele
// app.use(verifyIfExistsAccountCPF);

// *********SEGUNDA****-***
// Se eu colocar na rota, só vai passar pela rota
app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    
    // utilizando o headres no insomnia
    // normalmente é utilizado o token como chave de acesso
    // mas como nesse exemplo nossa chave de acesso é o cpf
    
    // ESSE TRECHO ABAIXO COMENTADO PASSOU PARA DENTRO DO MIDDLEWARE
    //********************************************** */
    // const { cpf } = request.headers;

    // // diferente do some, o find vai retornar o que tem dentro, e não faz verificação através de condição
    // const customer = customers.find(customer => customer.cpf === cpf);

    // if(!customer) {
    //     return response.status(400).json({ error: "Customer not found" });
    // }
//**************************************************************** */
    return response.json(customer.statement);
});

// o middleware sendo passado para verificação de usuario
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } =request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({ error: "Insufficient funds!"});
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());
    
    return response.json(statement);
});

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    customers.splice(customer, 1);

    return response.status(200).json(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
});

app.listen(3333);