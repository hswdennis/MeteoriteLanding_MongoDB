// 0. Lista de datos
db.meteorite.find()


// 1. Numero de meteoritos registrados
db.meteorite.find().count()


// 2. Rango de años registrados
db.meteorite.find({},{_id: 0, 'name': 1, 'year': 1}).sort({year: -1}).limit(1)
db.meteorite.find({},{_id: 0, 'name': 1, 'year': 1}).sort({year: 1}).limit(5)


// 3. Proporción registro encontrado/avistado(caído)
// En este caso, la proporcion es obvia porque solo hay dos categorías y 1000 muestras
//  Si la situación fuera diferente, ejecutaríamos la segunda consulta
db.meteorite.aggregate([{$group: {_id: '$fall', Total: {$sum: 1}}}, {$sort: {Total: -1}}])

db.meteorite.aggregate([{ $group: { _id: '$_id', 'fall': { '$first': '$fall'}}},
                        { $facet: { 'nDocs': [{ $count: 'nDocs'},],'groupValues': [{ $group: {'_id': '$fall','total': {'$sum': 1}}},]}},
                        { $addFields: {'nDocs': { $arrayElemAt: ['$nDocs',0]}}},
                        { $unwind: "$groupValues"},
                        { $project: { "_id": 0, "Categoria": "$groupValues._id", "Suma": '$groupValues.total',"Tasa": {
                            $multiply: [{ $divide: [ '$groupValues.total', '$nDocs.nDocs']}, 100]}}}])


// 4. Años en los que más meteoritos cayeron o se descubrieron
var anio = { $year: { $dateFromString: { dateString: '$year' } } }
var fecha = { 'Anio': anio }

var fase1 = { $addFields: fecha }
var fase2 = {$group: {_id: '$Anio', Suma: {$sum: 1}}}
var fase3 = {$sort: {Suma: -1}}
var fase4 = {$limit: 5}

var etapas = [ fase1, fase2, fase3, fase4 ]
db.meteorite.aggregate(etapas)


// 5. Meteoritos que no tienen registrada su geolocalización

db.meteorite.find({ geolocation: { $exists: false, $not: {$size: 0} } })
db.meteorite.find({ geolocation: { $exists: false, $not: {$size: 0} } }).count() // 12

// 6. Cuenta todos los tipos de elementos que hay
db.meteorite.aggregate([{$group: {_id: '$recclass', Total: {$sum: 1}}}, {$sort: {Total: -1}}])


// Los tipos compuestos no los agrupa, por ejemplo, Iron IIE no lo lo considera igual a Iron IVA
// Nos gustaría saber cuantos contienen hierro
// 7. Cuenta los meteoritos que contienen hierro
db.meteorite.find({recclass: {$regex: /^iron/i}}).count()


// 8. Media de peso por tipo de meteorito
db.meteorite.aggregate([{$unwind: '$recclass'},
                        {$group: {_id: '$recclass', Media: {$avg: { $toDouble: '$mass'} }}},
                        {$sort: {Media: -1}},
                        {$project:{_id:'$_id', roundAvg: {$ceil:'$Media'}}},
                        {$limit: 10}])
                        


// 9. Vamos a comprobar a que valor de latitud es más probable que caigan meteoritos
// Para la explicación en el informe tambien lo realizo con la longitud
var zona = { $round: [{$divide : [{ $toDouble: '$reclong'}, 10]}, 0]}
var zonaCampo = { 'Zona': zona }
var fase1 = { $addFields: zonaCampo }
var fase2 = { $group: {_id: '$Zona', Suma: {$sum: 1}}}
var fase3 = { $sort: {_id: -1}}

var etapas = [ fase1, fase2, fase3]
db.meteorite.aggregate(etapas)

// ¿Es el hierro más probable de caer en distintas zonas?
var filtro = {recclass: {$regex: /^iron/i}}
var faseFiltro = { $match: filtro }

var detapas = [ fase1, faseFiltro, fase2, fase3]
db.meteorite.aggregate( detapas )


// Después de trabajar con los datos, realizaremos un par de ejercicios de insert y update con datos inventados
// 11. Insercción de datos

var nuevo_item = { name: 'Madrid', id: '110', nametype:'Valid', recclass: 'Iron', mass: '1000',  fall: 'Fell', year: '2005-01-01T00:00:00.000', reclat: '45', reclong: '45', geolocation: {type:'Point', coordinates: [45,45]} }
db.meteorite2.insertOne( nuevo_item )

var array_items= [

{ name: 'Paris', id: '111', nametype:'Valid', recclass: 'Iron', mass: '55120',  fall: 'Fell', year: '2012-01-01T00:00:00.000', reclat: '48.858243240661885', reclong: '2.294426150009601', geolocation: {type:'Point', coordinates: [48.858243240661885, 2.294426150009601]} },
{ name: 'Londres', id: '112', nametype:'Valid', recclass: 'Iron, IVA', mass: '12300.90',  fall: 'Found', year: '2008-01-01T00:00:00.000', reclat: '53.4832071674224', reclong: '-2.2005032925866983', geolocation: {type:'Point', coordinates: [53.4832071674224, -2.2005032925866983]} },
{ name: 'Unknown', id: '113', nametype:'Valid', recclass: 'L6', mass: '9700',  fall: 'Fell', year: '2007-01-01T00:00:00.000', reclat: '', reclong: '', geolocation: {type:'Point', coordinates: []} },
{ name: 'Santa Cruz de la Sierra', id: '114', nametype:'Valid', recclass: 'H', mass: '3200.54',  fall: 'Fell', year: '1998-01-01T00:00:00.000', reclat: '-17.81736529414495', reclong: '-63.07619472964719', geolocation: {type:'Point', coordinates: [-17.81736529414495, -63.07619472964719]} }]

db.meteorite2.insertMany( array_items )

var query= { 'recclass': 'Iron' }
db.meteorite2.find( query )

// 12. Vamos a actualizar el capo del peso a un valor númerico para en futuro realizar operaciones
db.meteorite2.updateMany({ }, [{ $set: { "mass" : { $toDouble: '$mass'} } }])
db.meteorite2.find()

// 13. En el campo del año hay mucha informacion que sobra, vamos a actualizar el campo con solo el año
var anio = { $year: { $dateFromString: { dateString: '$year' } } }
var fecha = { 'Anio': anio }

db.meteorite2.updateMany({ }, [{ $set: { 'Anio' : anio } }, { $unset: 'year' }])
db.meteorite2.find()

